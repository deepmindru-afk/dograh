"""LiveKit Agent Worker — dedicated process that runs VoicePipelineAgents.

This worker connects to the LiveKit server and listens for agent dispatch
jobs. When a job arrives (triggered by the API dispatching an agent to a
room), the worker resolves the workflow configuration from the database,
creates an Agent, and runs the conversation.

Usage:
    python -m api.services.livekit.worker
"""

import json
import os

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from loguru import logger

from api.db import db_client
from api.services.livekit.agent_runner import create_agent, create_session


async def entrypoint(job: JobContext) -> None:
    """Called by the LiveKit agent framework when a job is dispatched."""
    logger.info(
        "LiveKit agent job received",
        room=job.room.name,
        agent=job.agent_name,
    )

    # Parse workflow config from dispatch metadata
    metadata = {}
    if job.metadata:
        try:
            metadata = json.loads(job.metadata)
        except json.JSONDecodeError:
            logger.warning("Failed to parse job metadata", metadata=job.metadata)

    workflow_run_id = metadata.get("workflow_run_id")
    organization_id = metadata.get("organization_id")

    # Resolve workflow configuration from the database
    system_prompt = None
    user_config = None

    if workflow_run_id and organization_id:
        try:
            from api.services.configuration.resolve import resolve_effective_config

            workflow_run = await db_client.get_workflow_run_by_id(workflow_run_id)
            if workflow_run and workflow_run.definition:
                run_configs = workflow_run.definition.workflow_configurations or {}
                system_prompt = run_configs.get("system_prompt")

                # Fetch the workflow to get the user_id for config resolution
                workflow = await db_client.get_workflow(
                    workflow_run.workflow_id,
                    organization_id=organization_id,
                )
                if workflow:
                    user_id = workflow.user_id
                    raw_config = await db_client.get_user_configurations(user_id)
                    user_config = resolve_effective_config(
                        raw_config, run_configs.get("model_overrides")
                    )
        except Exception as exc:
            logger.error("Failed to resolve workflow config", exc_info=exc)

    # Connect to the room as the agent participant
    await job.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("Connected to LiveKit room", room=job.room.name)

    # Publish session started data message
    await job.room.local_participant.publish_data(
        json.dumps({"type": "session_started"}).encode()
    )

    # Create the Agent
    agent = await create_agent(
        job,
        system_prompt=system_prompt,
        user_config=user_config,
    )

    # Create the AgentSession
    session = await create_session(
        job,
        system_prompt=system_prompt,
        user_config=user_config,
    )

    # Update DB session status to running
    if workflow_run_id:
        try:
            lk_session = await db_client.get_session_by_room_name(job.room.name)
            if lk_session:
                await db_client.update_session_status(
                    session_id=lk_session.id,
                    status="running",
                )
        except Exception as exc:
            logger.warning("Failed to update session status", exc_info=exc)

    try:
        # Start the session — this joins the room and begins the conversation
        await session.start(
            agent=agent,
            room=job.room,
        )
        logger.info("LiveKit agent session started", room=job.room.name)

        # Wait until the room is empty or agent is disconnected
        await job.wait_for_end()

    except Exception as exc:
        logger.error("LiveKit agent session error", exc_info=exc)
        # Publish error data message
        try:
            await job.room.local_participant.publish_data(
                json.dumps({"type": "pipeline_error", "message": str(exc)}).encode()
            )
        except Exception:
            pass
        raise
    finally:
        logger.info("LiveKit agent session ended", room=job.room.name)


def main() -> None:
    """Entry point for the worker process."""
    logger.info("Starting LiveKit agent worker...")

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=os.getenv("LIVEKIT_AGENT_NAME", "dograh-agent"),
        )
    )


if __name__ == "__main__":
    main()
