import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, digilocker, decisioning

router = APIRouter(prefix="/ekyc", tags=["ekyc"])


@router.post("/digilocker/init/{user_id}", response_model=schemas.DigilockerInitResponse)
async def init_digilocker(user_id: str, db: Session = Depends(get_db)):
    """
    Screen 3 (DigiLocker Consent Screen) calls this on load.
    Creates a Setu DigiLocker request and returns the redirect URL to send
    the user's browser to.
    """
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "user not found")

    setu_resp = await digilocker.create_digilocker_request()

    req_row = models.DigilockerRequest(
        user_id=user_id,
        setu_request_id=setu_resp["id"],
        redirect_url=setu_resp["url"],
        consent_status=setu_resp["status"],
    )
    db.add(req_row)
    db.commit()

    return schemas.DigilockerInitResponse(
        request_id=setu_resp["id"],
        redirect_url=setu_resp["url"],
    )


@router.get("/digilocker/status/{request_id}", response_model=schemas.DigilockerStatusResponse)
async def digilocker_status(request_id: str, db: Session = Depends(get_db)):
    """
    Screen 3 polls this after redirecting the user to DigiLocker, to know
    when consent has been granted (status flips unauthenticated -> authenticated).
    """
    setu_resp = await digilocker.get_request_status(request_id)

    req_row = (
        db.query(models.DigilockerRequest)
        .filter(models.DigilockerRequest.setu_request_id == request_id)
        .first()
    )
    if req_row:
        req_row.consent_status = setu_resp["status"]
        db.commit()

    return schemas.DigilockerStatusResponse(
        request_id=request_id,
        consent_status=setu_resp["status"],
    )


@router.post("/digilocker/fetch-aadhaar/{request_id}", response_model=schemas.AadhaarFetchResponse)
async def fetch_aadhaar(request_id: str, db: Session = Depends(get_db)):
    """
    Call once status == 'authenticated'. Pulls real Aadhaar data from Setu,
    stores it, and advances the orchestrator state to 'ekyc_done'.
    """
    req_row = (
        db.query(models.DigilockerRequest)
        .filter(models.DigilockerRequest.setu_request_id == request_id)
        .first()
    )
    if not req_row:
        raise HTTPException(404, "digilocker request not found")

    setu_resp = await digilocker.fetch_aadhaar_data(request_id)
    aadhaar = setu_resp.get("aadhaar", {})
    address = aadhaar.get("address", {})
    address_str = ", ".join(v for v in address.values() if v)

    doc = models.Document(
        user_id=req_row.user_id,
        doc_type="AADHAAR",
        source="digilocker",
        name=aadhaar.get("name"),
        dob=aadhaar.get("dateOfBirth"),
        address=address_str,
        id_number_masked=aadhaar.get("maskedNumber"),
        photo_base64=aadhaar.get("photo") or None,
        raw_response=json.dumps(setu_resp),
    )
    db.add(doc)

    status_row = db.query(models.VerificationStatus).filter_by(user_id=req_row.user_id).first()
    if status_row:
        status_row.state = "ekyc_done"

    db.commit()

    return schemas.AadhaarFetchResponse(
        name=doc.name,
        dob=doc.dob,
        address=doc.address,
        photo_base64=doc.photo_base64,
        id_number_masked=doc.id_number_masked,
        fetched_at=doc.fetched_at,
    )


@router.post("/cross-check", response_model=schemas.CrossCheckResponse)
def cross_check(payload: schemas.CrossCheckRequest, db: Session = Depends(get_db)):
    """
    Compares the name from DigiLocker (Aadhaar) against the name from Setu's
    PAN verification API for the same user. Call this after both
    /ekyc/digilocker/fetch-aadhaar and /pan/verify have completed.
    """
    aadhaar_doc = (
        db.query(models.Document)
        .filter(models.Document.user_id == payload.user_id, models.Document.source == "digilocker")
        .order_by(models.Document.fetched_at.desc())
        .first()
    )
    pan_doc = (
        db.query(models.Document)
        .filter(models.Document.user_id == payload.user_id, models.Document.source == "setu_pan_api")
        .order_by(models.Document.fetched_at.desc())
        .first()
    )

    if not aadhaar_doc or not aadhaar_doc.name:
        raise HTTPException(400, "no Aadhaar data found for this user yet -- run DigiLocker fetch first")
    if not pan_doc or not pan_doc.name:
        raise HTTPException(400, "no PAN data found for this user yet -- run /pan/verify first")

    similarity = fuzz.token_sort_ratio(aadhaar_doc.name.lower(), pan_doc.name.lower())
    matched = similarity >= 85  # tune threshold as needed; names can differ slightly in formatting

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "cross_checked"
        status_row.cross_check_passed = matched
        decisioning.recompute_final_status(status_row)

    db.commit()

    return schemas.CrossCheckResponse(
        matched=matched,
        name_similarity=round(similarity, 2),
        aadhaar_name=aadhaar_doc.name,
        pan_name=pan_doc.name,
        checked_at=datetime.utcnow(),
    )
