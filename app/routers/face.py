from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, face_match, decisioning

router = APIRouter(prefix="/face", tags=["face"])


@router.post("/match", response_model=schemas.FaceMatchResponse)
def match(payload: schemas.FaceMatchRequest, db: Session = Depends(get_db)):
    """
    Screen 4 (Selfie capture) calls this after the user takes a live selfie.
    Compares it against the Aadhaar photo already fetched via DigiLocker.
    Requires /ekyc/digilocker/fetch-aadhaar to have run first (that's where
    the Aadhaar photo comes from -- never from an uploaded document image).
    """
    aadhaar_doc = (
        db.query(models.Document)
        .filter(models.Document.user_id == payload.user_id, models.Document.source == "digilocker")
        .order_by(models.Document.fetched_at.desc())
        .first()
    )
    if not aadhaar_doc or not aadhaar_doc.photo_base64:
        raise HTTPException(
            400,
            "no Aadhaar photo found for this user -- run /ekyc/digilocker/fetch-aadhaar first",
        )

    result = face_match.match_faces(payload.selfie_base64, aadhaar_doc.photo_base64)

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "face_matched" if result["matched"] else "face_match_failed"
        status_row.face_match_passed = result["matched"]
        decisioning.recompute_final_status(status_row)

    db.commit()

    return schemas.FaceMatchResponse(
        matched=result["matched"],
        similarity_score=result["similarity_score"],
        quality_issue=result["quality_issue"],
        checked_at=datetime.utcnow(),
    )
