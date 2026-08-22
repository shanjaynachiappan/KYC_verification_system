"""
Pydantic request/response shapes for the agent-led KYC flow.
Self-contained (like schemas_business.py) so app/schemas.py doesn't need editing.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AgentSessionCreateRequest(BaseModel):
    user_id: str
    reason: str  # e.g. "face_match_borderline", "deepfake_confidence_borderline"


class AgentSessionResponse(BaseModel):
    session_id: str
    user_id: str
    reason: str
    status: str                      # waiting / in_progress / completed
    agent_name: Optional[str] = None
    decision: Optional[str] = None   # approved / rejected
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    video_room_url: Optional[str] = None


class AgentClaimRequest(BaseModel):
    agent_name: str


class AgentDecisionRequest(BaseModel):
    decision: str   # "approved" | "rejected"
    notes: Optional[str] = None


class ChatMessageResponse(BaseModel):
    sender_role: str   # "applicant" | "agent"
    message: str
    sent_at: datetime