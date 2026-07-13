import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, pan

router = APIRouter(prefix="/pan", tags=["pan"])


@router.post("/verify", response_model=schemas.PANVerifyResponse)
async def verify_pan(payload: schemas.PANVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies a PAN number via Setu/NSDL.
    Sandbox test values: ABCDE1234A (valid), ABCDE1234B (invalid), anything else -> 404.
    """
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "user not found")

    try:
        setu_resp = await pan.verify_pan(payload.pan, payload.reason)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(404, "PAN not found")
        raise HTTPException(e.response.status_code, f"Setu PAN API error: {e.response.text}")

    data = setu_resp.get("data", {})
    is_valid = setu_resp.get("verification") == "success" and setu_resp.get("message") == "PAN is valid"

    doc = models.Document(
        user_id=payload.user_id,
        doc_type="PAN",
        source="setu_pan_api",
        name=data.get("full_name"),
        id_number_masked=payload.pan[:5] + "XXXXX",  # never store the raw PAN in plaintext
        raw_response=json.dumps(setu_resp),
    )
    db.add(doc)
    db.commit()

    return schemas.PANVerifyResponse(
        valid=is_valid,
        full_name=data.get("full_name"),
        category=data.get("category"),
        aadhaar_seeding_status=data.get("aadhaar_seeding_status"),
        message=setu_resp.get("message", ""),
        verified_at=doc.fetched_at,
    )
