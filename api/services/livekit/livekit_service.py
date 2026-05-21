"""LiveKit server management service.

Provides room creation, participant token generation, and room
status queries via the livekit-api package.
"""

from livekit.api import LiveKitAPI, ListRoomsRequest
from livekit.protocol import models as lk_models

from api.services.livekit.config import get_livekit_config

_instances: dict[str, "LiveKitService"] = {}


def get_livekit_service() -> "LiveKitService":
    """Return the singleton LiveKitService for this process."""
    cfg = get_livekit_config()
    key = f"{cfg.host}/{cfg.api_key}"
    if key not in _instances:
        _instances[key] = LiveKitService(cfg.api_key, cfg.api_secret, cfg.host)
    return _instances[key]


class LiveKitService:
    def __init__(self, api_key: str, api_secret: str, host: str):
        self._api_key = api_key
        self._api_secret = api_secret
        self._host = host
        self._api: LiveKitAPI | None = None

    async def start(self) -> None:
        self._api = LiveKitAPI(
            host=self._host,
            api_key=self._api_key,
            api_secret=self._api_secret,
        )

    async def stop(self) -> None:
        if self._api:
            await self._api.aclose()
            self._api = None

    async def create_room(
        self,
        name: str,
        empty_timeout: int = 300,
        max_participants: int = 2,
    ) -> lk_models.Room:
        api = self._api
        room = await api.room.create_room(
            name=name,
            empty_timeout=empty_timeout,
            max_participants=max_participants,
        )
        return room

    async def generate_token(
        self,
        room_name: str,
        identity: str,
        ttl_seconds: int = 3600,
        can_publish: bool = True,
        can_subscribe: bool = True,
    ) -> str:
        from livekit.api import AccessToken, VideoGrants

        grants = VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=can_publish,
            can_subscribe=can_subscribe,
        )
        token = AccessToken(
            api_key=self._api_key,
            api_secret=self._api_secret,
            identity=identity,
            ttl=ttl_seconds,
        )
        token.grants = grants
        return token.to_jwt()

    async def list_participants(self, room_name: str) -> list[lk_models.ParticipantInfo]:
        api = self._api
        participants = await api.room.list_participants(room=room_name)
        return participants

    async def remove_participant(self, room_name: str, identity: str) -> None:
        api = self._api
        await api.room.remove_participant(room=room_name, identity=identity)

    async def list_rooms(self) -> list[lk_models.Room]:
        api = self._api
        rooms = await api.room.list_rooms(ListRoomsRequest())
        return rooms

    async def delete_room(self, room_name: str) -> None:
        api = self._api
        await api.room.delete_room(room=room_name)

    async def dispatch_agent(
        self, room_name: str, agent_name: str | None = None, metadata: str | None = None
    ) -> lk_models.AgentDispatch:
        api = self._api
        dispatch = await api.agent_dispatch.create_dispatch(
            room=room_name,
            agent_name=agent_name or get_livekit_config().agent_name,
            metadata=metadata or "",
        )
        return dispatch
