"""
Agent-Led KYC flow.

Triggered only when face-match similarity and/or deepfake-authenticity
confidence land in the BORDERLINE band (see app/routers/face.py's
review_required computation) -- not confidently passed, not confidently
failed. Instead of a silent auto-pass or a hard auto-reject, the applicant
is connected to a live human agent over a real-time chat channel for manual
review, after the AML check step.

Session lifecycle:
  waiting -> (agent claims it) -> in_progress -> (agent decides) -> completed

Two REST surfaces:
  - Applicant side: create session, poll status
  - Agent side: list waiting sessions, claim, submit decision

Plus one WebSocket endpoint both sides connect to for the live chat itself.
Chat messages are persisted (AgentChatMessage) for audit trail purposes,
same reasoning as why review.py keeps the selfie on file for officer review.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app import models
from app import schemas_agent as schemas
from app.ws_manager import manager
from app import video

router = APIRouter(prefix="/agent", tags=["agent-led-kyc"])

async def create_session_video_room(session_id: str) -> str | None:
    return await video.create_room(session_id)
# ---------- Session lifecycle (REST) ----------
@router.post("/sessions", response_model=schemas.AgentSessionResponse)
async def create_session(payload: schemas.AgentSessionCreateRequest, db: Session = Depends(get_db)):
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "user not found")

    # Reuse an existing open session for this user instead of spawning duplicates
    # (e.g. if the applicant refreshes the Agent-Led KYC page).
    existing = (
        db.query(models.AgentSession)
        .filter(models.AgentSession.user_id == payload.user_id, models.AgentSession.status != "completed")
        .order_by(models.AgentSession.created_at.desc())
        .first()
    )
    if existing:
        return _to_response(existing)

    session_row = models.AgentSession(
        user_id=payload.user_id,
        reason=payload.reason,
        status="waiting",
    )
    db.add(session_row)
    db.commit()

    room_url = await create_session_video_room(session_row.id)
    session_row.video_room_url = room_url
    db.commit()

    return _to_response(session_row)

@router.get("/sessions", response_model=list[schemas.AgentSessionResponse])
def list_sessions(status_filter: str | None = None, db: Session = Depends(get_db)):
    """Agent console calls this to see waiting/in-progress sessions."""
    query = db.query(models.AgentSession)
    if status_filter:
        query = query.filter(models.AgentSession.status == status_filter)
    rows = query.order_by(models.AgentSession.created_at.asc()).all()
    return [_to_response(r) for r in rows]


@router.get("/sessions/{session_id}", response_model=schemas.AgentSessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    row = db.get(models.AgentSession, session_id)
    if not row:
        raise HTTPException(404, "session not found")
    return _to_response(row)


@router.post("/sessions/{session_id}/claim", response_model=schemas.AgentSessionResponse)
def claim_session(session_id: str, payload: schemas.AgentClaimRequest, db: Session = Depends(get_db)):
    row = db.get(models.AgentSession, session_id)
    if not row:
        raise HTTPException(404, "session not found")
    row.status = "in_progress"
    row.agent_name = payload.agent_name
    db.commit()
    return _to_response(row)


@router.post("/sessions/{session_id}/decision", response_model=schemas.AgentSessionResponse)
def submit_decision(session_id: str, payload: schemas.AgentDecisionRequest, db: Session = Depends(get_db)):
    row = db.get(models.AgentSession, session_id)
    if not row:
        raise HTTPException(404, "session not found")

    row.status = "completed"
    row.decision = payload.decision  # "approved" | "rejected"
    row.notes = payload.notes
    db.commit()

    # Reflect the agent's decision in the applicant's overall verification status.
    status_row = db.query(models.VerificationStatus).filter_by(user_id=row.user_id).first()
    if status_row:
        status_row.state = "agent_reviewed"
        status_row.final_status = "verified" if payload.decision == "approved" else "flagged"
        db.commit()

    return _to_response(row)


@router.get("/sessions/{session_id}/messages", response_model=list[schemas.ChatMessageResponse])
def get_messages(session_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(models.AgentChatMessage)
        .filter_by(session_id=session_id)
        .order_by(models.AgentChatMessage.sent_at.asc())
        .all()
    )
    return [
        schemas.ChatMessageResponse(sender_role=r.sender_role, message=r.message, sent_at=r.sent_at)
        for r in rows
    ]


def _to_response(row: models.AgentSession) -> schemas.AgentSessionResponse:
    return schemas.AgentSessionResponse(
        session_id=row.id,
        user_id=row.user_id,
        reason=row.reason,
        status=row.status,
        agent_name=row.agent_name,
        decision=row.decision,
        notes=row.notes,
        video_room_url=row.video_room_url,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


# ---------- Live chat (WebSocket) ----------
@router.websocket("/ws/{session_id}/{role}")
async def agent_chat_ws(websocket: WebSocket, session_id: str, role: str):
    """
    role must be "applicant" or "agent". Both sides connect to the same
    session_id; any {"message": "..."} sent by one side is relayed to the
    other and persisted to AgentChatMessage.
    """
    if role not in ("applicant", "agent"):
        await websocket.close(code=4000)
        return

    await manager.connect(session_id, role, websocket)
    db = SessionLocal()
    try:
        # Let the other side know someone joined.
        await manager.broadcast(session_id, {"type": "presence", "role": role, "event": "joined"})

        while True:
            data = await websocket.receive_json()
            text = data.get("message", "").strip()
            if not text:
                continue

            msg_row = models.AgentChatMessage(
                session_id=session_id,
                sender_role=role,
                message=text,
            )
            db.add(msg_row)
            db.commit()

            await manager.relay(
                session_id,
                role,
                {"type": "message", "sender_role": role, "message": text, "sent_at": datetime.utcnow().isoformat()},
            )
    except WebSocketDisconnect:
        manager.disconnect(session_id, role)
        await manager.broadcast(session_id, {"type": "presence", "role": role, "event": "left"})
    finally:
        db.close()