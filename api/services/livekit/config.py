from dataclasses import dataclass, field

from api.constants import (
    LIVEKIT_AGENT_NAME,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    LIVEKIT_HOST,
    LIVEKIT_WS_URL,
)


@dataclass(frozen=True)
class LiveKitConfig:
    api_key: str = field(default_factory=lambda: LIVEKIT_API_KEY)
    api_secret: str = field(default_factory=lambda: LIVEKIT_API_SECRET)
    host: str = field(default_factory=lambda: LIVEKIT_HOST)
    ws_url: str = field(default_factory=lambda: LIVEKIT_WS_URL)
    agent_name: str = field(default_factory=lambda: LIVEKIT_AGENT_NAME)


_config: LiveKitConfig | None = None


def get_livekit_config() -> LiveKitConfig:
    global _config
    if _config is None:
        _config = LiveKitConfig()
    return _config
