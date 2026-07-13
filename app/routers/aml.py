import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, aml, decisioning

router = APIRouter(prefix="/aml", tags=["aml"])


@router.post("/screen", response_model=schemas.AMLScreenResponse)
def screen(payload: schemas.AMLScreenRequest, db: Session = Depends(get_db)):
    """
    Screen 6 (AML Screening Result) calls this after eKYC is done.
    Runs the verified name through the sanctions/PEP list.
    """
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "user not found")

    result = aml.screen_name(payload.name)

    aml_row = models.AMLResult(
        user_id=payload.user_id,
        name_checked=payload.name,
        matched=result["matched"],
        best_score=result["best_score"],
        matched_entries=json.dumps(result["matches"]),
    )
    db.add(aml_row)

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "aml_checked"
        status_row.aml_flagged = result["matched"]
        decisioning.recompute_final_status(status_row)

    db.commit()

    return schemas.AMLScreenResponse(
        matched=result["matched"],
        best_score=result["best_score"],
        matches=result["matches"],
        checked_at=aml_row.checked_at,
    )
