"""
Thin client around Setu's DigiLocker Sandbox API.
Docs: https://docs.setu.co/data/digilocker/quickstart

Endpoints used:
  POST /api/digilocker/                -> create a request, get redirect url
  GET  /api/digilocker/:id/status      -> poll consent status
  GET  /api/digilocker/:id/aadhaar     -> fetch Aadhaar JSON once authenticated
"""
import httpx

from app.config import settings

HEADERS = {
    "x-client-id": settings.setu_client_id,
    "x-client-secret": settings.setu_client_secret,
    "x-product-instance-id": settings.setu_digilocker_product_id,
    "Content-Type": "application/json",
}


async def create_digilocker_request() -> dict:
    """
    Kicks off a new DigiLocker consent journey.
    Returns: {"id": ..., "status": "unauthenticated", "url": ..., "validUpto": ...}
    """
    async with httpx.AsyncClient(base_url=settings.setu_base_url, timeout=30) as client:
        resp = await client.post(
            "/api/digilocker/",
            headers=HEADERS,
            json={"redirectUrl": settings.setu_redirect_url},
        )
        resp.raise_for_status()
        return resp.json()


async def get_request_status(request_id: str) -> dict:
    """
    Poll consent status for a given request id.
    status is one of: unauthenticated | authenticated | revoked
    """
    async with httpx.AsyncClient(base_url=settings.setu_base_url, timeout=30) as client:
        resp = await client.get(
            f"/api/digilocker/{request_id}/status",
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_aadhaar_data(request_id: str) -> dict:
    """
    Only works once status == 'authenticated'.
    Returns the aadhaar dict shape shown in Setu's docs:
    { "aadhaar": {"name":..., "dateOfBirth":..., "address": {...}, "photo": "<base64 or empty>", ...},
      "id": ..., "status": "complete" }
    """
    async with httpx.AsyncClient(base_url=settings.setu_base_url, timeout=30) as client:
        resp = await client.get(
            f"/api/digilocker/{request_id}/aadhaar",
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()
