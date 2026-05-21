"""Agent session management service.

Coordinates LiveKit room creation, token generation, agent dispatch,
and database session tracking for LiveKit-based voice pipeline runs.
"""

import json

from loguru import logger

from api.db import db_client
from api.services.livekit.config import get_livekit_config
from api.services.livekit.livekit_service import get_livekit_service


async def start_livekit_session(
    *,
    organization_id: int,
    workflow_run_id: int | None = None,
    agent_name: str | None = None,
    room_name: str | None = None,
) -> dict:
    """Create a LiveKit room, generate a browser token, dispatch the agent,
    and persist a session row in the database.

    Returns a dict with:
        room_name (str)
        token (str) — browser participant JWT
        session_id (int) — DB row id
    """
    cfg = get_livekit_config()
    lk = get_livekit_service()

    if room_name is None:
        room_name = f"dograh-{workflow_run_id or organization_id}-{id({})}"

    agent = agent_name or cfg.agent_name

    # Create room on LiveKit server
    await lk.create_room(room_name, empty_timeout=300, max_participants=2)
    logger.info("Created LiveKit room", room=room_name)

    # Generate browser participant token
    token = await lk.generate_token(
        room_name=room_name,
        identity=f"user-{organization_id}",
    )

    # Dispatch agent to the room
    agent_metadata = json.dumps(
        {
            "workflow_run_id": workflow_run_id,
            "organization_id": organization_id,
        }
    )
    await lk.dispatch_agent(
        room_name=room_name,
        agent_name=agent,
        metadata=agent_metadata,
    )
    logger.info("Dispatched LiveKit agent", room=room_name, agent=agent)

    # Persist session row
    session = await db_client.create_agent_session(
        room_name=room_name,
        organization_id=organization_id,
        workflow_run_id=workflow_run_id,
        agent_name=agent,
    )

    return {
        "room_name": room_name,
        "token": token,
        "session_id": session.id,
    }


async def stop_livekit_session(
    session_id: int,
    room_name: str,
    organization_id: int,
) -> None:
    """End a LiveKit session: delete room and update session status."""
    lk = get_livekit_service()

    try:
        await lk.delete_room(room_name)
    except Exception:
        logger.warning("Failed to delete LiveKit room (may already be gone)", room=room_name)

    await db_client.update_session_status(
        session_id=session_id,
        status="completed",
    )
