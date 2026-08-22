"""
Minimal in-memory WebSocket room manager for agent-led KYC chat sessions.

Each agent session (see models.AgentSession) gets a "room" keyed by
session_id, with up to two participants: the applicant and the agent.
Messages sent by either side are relayed to the other side in real time.

This is intentionally in-memory / single-process -- fine for a demo or a
single uvicorn worker. For multi-worker/production deployment, swap this
for a Redis pub/sub-backed manager so rooms are shared across processes.
"""
from fastapi import WebSocket


class AgentRoomManager:
    def __init__(self):
        # session_id -> {"applicant": WebSocket | None, "agent": WebSocket | None}
        self.rooms: dict[str, dict[str, WebSocket | None]] = {}

    def _room(self, session_id: str) -> dict:
        if session_id not in self.rooms:
            self.rooms[session_id] = {"applicant": None, "agent": None}
        return self.rooms[session_id]

    async def connect(self, session_id: str, role: str, websocket: WebSocket):
        await websocket.accept()
        self._room(session_id)[role] = websocket

    def disconnect(self, session_id: str, role: str):
        if session_id in self.rooms:
            self.rooms[session_id][role] = None
            if not self.rooms[session_id]["applicant"] and not self.rooms[session_id]["agent"]:
                del self.rooms[session_id]

    async def relay(self, session_id: str, from_role: str, payload: dict):
        """Sends payload to the OTHER participant in the room, if connected."""
        other_role = "agent" if from_role == "applicant" else "applicant"
        room = self.rooms.get(session_id, {})
        other_ws = room.get(other_role)
        if other_ws is not None:
            await other_ws.send_json(payload)

    async def broadcast(self, session_id: str, payload: dict):
        """Sends payload to BOTH participants (e.g. session-status changes)."""
        room = self.rooms.get(session_id, {})
        for ws in room.values():
            if ws is not None:
                await ws.send_json(payload)


# Single shared instance imported by app/routers/agent.py
manager = AgentRoomManager()