"""Maps Dograh workflow configuration to a livekit-agents VoicePipelineAgent.

This module is imported by the dedicated agent worker process
(api.services.livekit.worker) to build and run an Agent per call.
"""

from livekit.agents import JobContext
from livekit.agents.llm import FunctionTool
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import cartesia, deepgram, elevenlabs, openai, silero


def resolve_stt(user_config) -> object | None:
    """Map Dograh STT config to a livekit-plugins STT instance."""
    if not user_config or not user_config.stt:
        return None
    provider = user_config.stt.provider
    model = user_config.stt.model

    if provider == "deepgram":
        return deepgram.STT(model=model or "nova-2")
    elif provider == "openai":
        return openai.STT(model=model or "whisper-1")
    return None


def resolve_tts(user_config) -> object | None:
    """Map Dograh TTS config to a livekit-plugins TTS instance."""
    if not user_config or not user_config.tts:
        return None
    provider = user_config.tts.provider
    model = user_config.tts.model
    voice = getattr(user_config.tts, "voice", None)

    if provider == "elevenlabs":
        return elevenlabs.TTS(model=model or "eleven_turbo_v2_5", voice=voice)
    elif provider == "openai":
        return openai.TTS(model=model or "tts-1", voice=voice or "alloy")
    elif provider == "cartesia":
        return cartesia.TTS(model=model, voice=voice)
    elif provider == "deepgram":
        return deepgram.TTS(model=model or "aura-asteria-en")
    return None


def resolve_llm(user_config) -> object | None:
    """Map Dograh LLM config to a livekit-plugins LLM instance."""
    if not user_config or not user_config.llm:
        return None
    provider = user_config.llm.provider
    model = user_config.llm.model

    if provider == "openai":
        return openai.LLM(model=model or "gpt-4o")
    return None


async def create_agent(
    ctx: JobContext,
    *,
    system_prompt: str | None = None,
    user_config: object | None = None,
    tools: list[object] | None = None,
) -> Agent:
    """Create a livekit-agents ``Agent`` configured with the given workflow settings.

    The agent is not started yet — call ``await session.start(agent=agent, room=...)``
    after this returns.
    """
    stt = resolve_stt(user_config) if user_config else deepgram.STT()
    tts = resolve_tts(user_config) if user_config else elevenlabs.TTS()
    llm = resolve_llm(user_config) if user_config else openai.LLM(model="gpt-4o")

    instructions = system_prompt or (
        "You are a helpful voice assistant. "
        "Keep your responses concise and conversational."
    )

    agent = Agent(
        instructions=instructions,
        stt=stt,
        llm=llm,
        tts=tts,
        vad=silero.VAD(),
        tools=tools,
    )

    return agent


async def create_session(
    ctx: JobContext,
    *,
    system_prompt: str | None = None,
    user_config: object | None = None,
    tools: list[object] | None = None,
) -> AgentSession:
    """Create a livekit-agents ``AgentSession`` for the given workflow config.

    The session is pre-configured but not started.
    """
    stt = resolve_stt(user_config) if user_config else deepgram.STT()
    tts = resolve_tts(user_config) if user_config else elevenlabs.TTS()
    llm = resolve_llm(user_config) if user_config else openai.LLM(model="gpt-4o")

    session = AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=silero.VAD(),
        tools=tools,
    )

    return session
