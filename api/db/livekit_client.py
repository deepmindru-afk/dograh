from datetime import UTC, datetime

from sqlalchemy import select, update

from api.db.base_client import BaseDBClient
from api.db.models import LiveKitAgentSessionModel


class LiveKitClient(BaseDBClient):
    async def create_agent_session(
        self,
        room_name: str,
        organization_id: int,
        workflow_run_id: int | None = None,
        agent_name: str = "dograh-agent",
    ) -> LiveKitAgentSessionModel:
        session = LiveKitAgentSessionModel(
            room_name=room_name,
            organization_id=organization_id,
            workflow_run_id=workflow_run_id,
            agent_name=agent_name,
            status="initialized",
        )
        async with self.async_session() as db:
            db.add(session)
            await db.commit()
            await db.refresh(session)
            return session

    async def get_agent_session(
        self, session_id: int
    ) -> LiveKitAgentSessionModel | None:
        async with self.async_session() as db:
            result = await db.execute(
                select(LiveKitAgentSessionModel).where(
                    LiveKitAgentSessionModel.id == session_id
                )
            )
            return result.scalar_one_or_none()

    async def get_agent_sessions_by_organization(
        self, organization_id: int, limit: int = 50, offset: int = 0
    ) -> list[LiveKitAgentSessionModel]:
        async with self.async_session() as db:
            result = await db.execute(
                select(LiveKitAgentSessionModel)
                .where(
                    LiveKitAgentSessionModel.organization_id == organization_id
                )
                .order_by(LiveKitAgentSessionModel.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            return list(result.scalars().all())

    async def update_session_status(
        self,
        session_id: int,
        status: str,
        metadata: dict | None = None,
    ) -> LiveKitAgentSessionModel | None:
        now = datetime.now(UTC)
        values: dict = {
            "status": status,
            "updated_at": now,
        }
        if status == "running":
            values["started_at"] = now
        elif status in ("completed", "failed"):
            values["ended_at"] = now

        if metadata is not None:
            values["metadata"] = metadata

        async with self.async_session() as db:
            await db.execute(
                update(LiveKitAgentSessionModel)
                .where(LiveKitAgentSessionModel.id == session_id)
                .values(**values)
            )
            await db.commit()
            result = await db.execute(
                select(LiveKitAgentSessionModel).where(
                    LiveKitAgentSessionModel.id == session_id
                )
            )
            return result.scalar_one_or_none()

    async def get_session_by_room_name(
        self, room_name: str
    ) -> LiveKitAgentSessionModel | None:
        async with self.async_session() as db:
            result = await db.execute(
                select(LiveKitAgentSessionModel).where(
                    LiveKitAgentSessionModel.room_name == room_name
                )
            )
            return result.scalar_one_or_none()
