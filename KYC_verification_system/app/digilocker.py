"""
Thin client around Setu's DigiLocker Sandbox API.
Docs: https://docs.setu.co/data/digilocker/quickstart

Endpoints used:
  POST /api/digilocker/                -> create a request, get redirect url
  GET  /api/digilocker/:id/status      -> poll consent status
  GET  /api/digilocker/:id/aadhaar     -> fetch Aadhaar JSON once authenticated
"""
import httpx
import logging
import asyncio
from fastapi import HTTPException
from app.config import settings

logger = logging.getLogger(__name__)

HEADERS = {
    "x-client-id": settings.setu_client_id,
    "x-client-secret": settings.setu_client_secret,
    "x-product-instance-id": settings.setu_digilocker_product_id,
    "Content-Type": "application/json",
}

async def _setu_request_with_retries(method: str, url: str, **kwargs) -> dict:
    max_retries = 0
    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(base_url=settings.setu_base_url, timeout=10.0) as client:
                resp = await client.request(method, url, headers=HEADERS, **kwargs)
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                logger.error(f"Setu API upstream error: {e.response.status_code} on {url}. Attempt {attempt + 1}/{max_retries + 1}")
                if attempt < max_retries:
                    await asyncio.sleep(2)
                    continue
                
                print(f"Error: Setu DigiLocker API 500+ error: {e}. Setu API server is down.")
                raise HTTPException(
                    status_code=503,
                    detail={
                        "success": False,
                        "error_code": "DIGILOCKER_UNAVAILABLE",
                        "message": "DigiLocker service is temporarily unavailable. Please try again later."
                    }
                )
            else:
                raise
        except httpx.RequestError as e:
            logger.error(f"Setu API network error: {type(e).__name__} on {url}. Attempt {attempt + 1}/{max_retries + 1}")
            if attempt < max_retries:
                await asyncio.sleep(2)
                continue
            
            print(f"Error: Setu DigiLocker API error/timeout: {e}. Setu API server is down.")
            raise HTTPException(
                status_code=503,
                detail={
                    "success": False,
                    "error_code": "DIGILOCKER_UNAVAILABLE",
                    "message": "DigiLocker service is temporarily unavailable. Please try again later."
                }
            )
    raise RuntimeError("Unreachable")

async def create_digilocker_request() -> dict:
    """
    Kicks off a new DigiLocker consent journey.
    Returns: {"id": ..., "status": "unauthenticated", "url": ..., "validUpto": ...}
    """
    return await _setu_request_with_retries(
        "POST",
        "/api/digilocker/",
        json={"redirectUrl": settings.setu_redirect_url}
    )

async def get_request_status(request_id: str) -> dict:
    """
    Poll consent status for a given request id.
    status is one of: unauthenticated | authenticated | revoked
    """
    return await _setu_request_with_retries(
        "GET",
        f"/api/digilocker/{request_id}/status"
    )

async def fetch_aadhaar_data(request_id: str) -> dict:
    """
    Only works once status == 'authenticated'.
    Returns the aadhaar dict shape shown in Setu's docs:
    { "aadhaar": {"name":..., "dateOfBirth":..., "address": {...}, "photo": "<base64 or empty>", ...},
      "id": ..., "status": "complete" }
    """
    return await _setu_request_with_retries(
        "GET",
        f"/api/digilocker/{request_id}/aadhaar"
    )
