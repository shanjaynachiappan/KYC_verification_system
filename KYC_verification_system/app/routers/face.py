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

    # Terminal presentation logging for Face Match
    print("\n========================================")
    print("       SELFIE VERIFICATION")
    print("========================================")
    print("\n[1] Receiving selfie...")
    print("    ✓ Selfie received")
    
    print("\n[2] Checking image quality...")
    if result.get("quality_issue"):
        print("    ✗ Image quality failed")
    else:
        print("    ✓ Image quality passed")

    print("\n[3] Matching face with Aadhaar...")
    print("    ✓ Face matching completed")

    print("\n[4] Calculating identity score...")
    score_val = result["similarity_score"] * 100
    print("    ✓ Face score added to total")
    print("\n========================================")
    print("       SELFIE PROCESSING COMPLETE")
    print("========================================\n")

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "face_matched"
        status_row.face_match_passed = result["matched"]
        status_row.face_match_score = score_val
        previous_total = status_row.total_score if status_row.total_score is not None else 0.0
        if status_row.total_score is None:
            status_row.total_score = 0.0
        status_row.total_score += score_val
        status_row.selfie_base64 = payload.selfie_base64
        decisioning.recompute_final_status(status_row)
        
        print("========================================")
        print("     SELFIE VERIFICATION COMPLETE")
        print("========================================")
        print()
        print(f"Face Match Score      : {status_row.face_match_score:.2f}")
        print(f"Previous Total Score  : {previous_total:.2f}")
        print(f"Current Total Score   : {status_row.total_score:.2f}")
        print()
        print("Status                : READY FOR LIVENESS")
        print()
        print("========================================")
        print()

    db.commit()

    return schemas.FaceMatchResponse(
        matched=result["matched"],
        similarity_score=result["similarity_score"],
        quality_issue=result["quality_issue"],
        checked_at=datetime.utcnow(),
    )
