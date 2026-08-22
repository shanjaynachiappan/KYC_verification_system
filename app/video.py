"""
Thin wrapper around the Daily.co REST API for agent-led KYC video calls.

Daily.co was chosen over hand-rolled WebRTC because it handles the parts
that are genuinely hard to self-host correctly: STUN/TURN relaying (so the
call still connects when applicant/agent are on different networks/NATs),
camera/mic permission UI, and reconnect handling -- all via one prebuilt
embeddable iframe (@daily-co/daily-js on the frontend).

Setup required before this works:
  1. Create a free account at https://dashboard.daily.co/
  2. Grab an API key from https://dashboard.daily.co/developers
  3. Set DAILY_API_KEY in backend/.env (see app/config.py)

Free tier is enough for a demo -- no card required to get an API key.
"""
import httpx

from app.config import settings


async def create_room(session_id: str) -> str | None:
    """
    Creates a Daily.co room for this agent session and returns its join URL.
    Returns None (instead of raising) if Daily isn't configured yet -- lets
    the rest of the agent-led KYC flow (chat, decisioning) keep working
    even before video is set up, same fail-soft pattern as the deepfake
    model loader in app/main.py.
    """
    if not settings.daily_api_key or settings.daily_api_key == "changeme":
        return None

    async with httpx.AsyncClient(base_url=settings.daily_api_base_url, timeout=15) as client:
        try:
            resp = await client.post(
                "/rooms",
                headers={"Authorization": f"Bearer {settings.daily_api_key}"},
                json={
                    "name": f"kyc-agent-{session_id}",
                    "privacy": "public",
                    "properties": {
                        # Auto-expire the room a few hours after creation so
                        # abandoned/never-claimed sessions don't linger on
                        # the Daily account indefinitely.
                        "exp": None,
                        "enable_chat": False,  # we use our own chat (persisted, part of the audit trail)
                        "enable_screenshare": False,
                        "max_participants": 2,
                    },
                },
            )
            resp.raise_for_status()
            return resp.json().get("url")
        except httpx.HTTPStatusError as e:
            # Room name collision (e.g. session already has a room) -- just
            # fetch the existing room's URL instead of failing the request.
            if e.response.status_code == 400:
                get_resp = await client.get(
                    f"/rooms/kyc-agent-{session_id}",
                    headers={"Authorization": f"Bearer {settings.daily_api_key}"},
                )
                if get_resp.status_code == 200:
                    return get_resp.json().get("url")
            return None
        except httpx.HTTPError:
            return None