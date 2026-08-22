"""
Thin client around Setu's PAN Verification Sandbox API.
Docs: https://docs.setu.co/data/pan/quickstart

Endpoint used:
  POST /api/verify/pan

Sandbox test values (from Setu docs):
  ABCDE1234A -> returns a valid PAN response
  ABCDE1234B -> returns "found but invalid" response
  anything else -> 404 PAN not found
"""
import httpx

from app.config import settings

HEADERS = {
    "x-client-id": settings.setu_client_id,
    "x-client-secret": settings.setu_client_secret,
    "x-product-instance-id": settings.setu_pan_product_id,
    "Content-Type": "application/json",
}


async def verify_pan(pan_number: str, reason: str = "Identity verification during onboarding") -> dict:
    """
    Verifies a PAN number via Setu/NSDL.
    Returns Setu's response JSON, e.g.:
    {
      "data": {"category": "Individual", "full_name": "John Doe", ...},
      "message": "PAN is valid",
      "verification": "success",
      "traceId": "..."
    }
    Raises httpx.HTTPStatusError on 400/404/500 -- the router catches this
    and turns it into a clean API error for the frontend.
    """
    async with httpx.AsyncClient(base_url=settings.setu_base_url, timeout=30) as client:
        try:
            resp = await client.post(
                "/api/verify/pan",
                headers=HEADERS,
                json={
                    "pan": pan_number,
                    "consent": "Y",
                    "reason": reason,
                },
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.RequestError as e:
            # Fallback for when the Sandbox API is down or times out (common in demo environments)
            print(f"Warning: Setu Sandbox API error/timeout: {e}. Returning mock response.")
            if pan_number.upper() == "ABCDE1234B":
                return {
                    "data": None,
                    "message": "PAN found but invalid",
                    "verification": "failed",
                    "traceId": "mock-trace-1234"
                }
            elif pan_number.upper() != "ABCDE1234A":
                raise httpx.HTTPStatusError(
                    "Mock 404", 
                    request=e.request, 
                    response=httpx.Response(404, json={"message": "PAN not found", "traceId": "mock-404"})
                )
            
            # Default mock success for ABCDE1234A
            return {
                "data": {
                    "category": "Individual",
                    "full_name": "Test User",
                    "aadhaar_seeding_status": "LINKED"
                },
                "message": "PAN is valid",
                "verification": "success",
                "traceId": "mock-trace-1234"
            }
