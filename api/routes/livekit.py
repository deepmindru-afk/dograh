"""LiveKit API routes for room management and agent session control."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.db import db_client
from api.db.models import UserModel
from api.services.auth.depends import get_user
from api.services.livekit.agent_service import (
    start_livekit_session,
    stop_livekit_session,
)
from api.services.livekit.livekit_service import get_livekit_service

router = APIRouter(prefix="/livekit", tags=["livekit"])


class CreateRoomResponse(BaseModel):
    room_name: str
    token: str
    session_id: int


class TokenResponse(BaseModel):
    token: str


class SessionStatusResponse(BaseModel):
    id: int
    room_name: str
    status: str
    started_at: str | None = None
    ended_at: str | None = None
    metadata: dict | None = None


@router.post("/rooms", response_model=CreateRoomResponse)
async def create_room(
    workflow_run_id: int | None = None,
    user: UserModel = Depends(get_user),
):
    """Create a LiveKit room, generate a browser participant token,
    dispatch the agent, and persist a session row."""
    org_id = user.selected_organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization selected")

    result = await start_livekit_session(
        organization_id=org_id,
        workflow_run_id=workflow_run_id,
    )
    return CreateRoomResponse(
        room_name=result["room_name"],
        token=result["token"],
        session_id=result["session_id"],
    )


@router.post("/rooms/{room_name}/token", response_model=TokenResponse)
async def generate_token(
    room_name: str,
    user: UserModel = Depends(get_user),
):
    """Generate a participant token for an existing LiveKit room."""
    lk = get_livekit_service()
    identity = f"user-{user.selected_organization_id}-{id({})}"
    token = await lk.generate_token(
        room_name=room_name,
        identity=identity,
    )
    return TokenResponse(token=token)


@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: int,
    user: UserModel = Depends(get_user),
):
    """Get the status and metadata of a LiveKit agent session."""
    session = await db_client.get_agent_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.organization_id != user.selected_organization_id:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionStatusResponse(
        id=session.id,
        room_name=session.room_name,
        status=session.status,
        started_at=session.started_at.isoformat() if session.started_at else None,
        ended_at=session.ended_at.isoformat() if session.ended_at else None,
        metadata=session.metadata,
    )


@router.get("/rooms/{room_name}")
async def get_room_info(
    room_name: str,
    user: UserModel = Depends(get_user),
):
    """Get LiveKit room participants and status."""
    lk = get_livekit_service()
    try:
        participants = await lk.list_participants(room_name)
    except Exception:
        raise HTTPException(status_code=404, detail="Room not found")

    return {
        "room_name": room_name,
        "participants": [
            {"identity": p.identity, "joined_at": p.joined_at}
            for p in participants
        ],
        "participant_count": len(participants),
    }


@router.post("/sessions/{session_id}/stop")
async def stop_session(
    session_id: int,
    user: UserModel = Depends(get_user),
):
    """Stop a LiveKit agent session and clean up the room."""
    session = await db_client.get_agent_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.organization_id != user.selected_organization_id:
        raise HTTPException(status_code=404, detail="Session not found")

    await stop_livekit_session(
        session_id=session.id,
        room_name=session.room_name,
        organization_id=session.organization_id,
    )
    return {"status": "stopped"}
