import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, aml, decisioning, pep, adverse_media, sof

router = APIRouter(prefix="/aml", tags=["aml"])


@router.post("/screen", response_model=schemas.AMLScreenResponse)
def screen(payload: schemas.AMLScreenRequest, db: Session = Depends(get_db)):
    """
    Screen 6 (AML Screening Result) calls this after eKYC is done.
    Runs the verified name through all AML checks.
    """
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "user not found")

    sanctions_result = aml.screen_name(payload.name)
    pep_result = pep.screen_pep(payload.name)
    media_result = adverse_media.screen_adverse_media(payload.name)
    sof_result = sof.assess_sof(payload.declared_income_band, payload.declared_source)

    is_flagged = sanctions_result["matched"] or pep_result["matched"] or media_result["matched"] or (sof_result["risk_level"] == "HIGH")

    # Calculate AML score/risk logic
    # Base score out of 100
    aml_score = 100.0
    if sanctions_result["matched"]:
        aml_score -= 50
    if pep_result["matched"]:
        aml_score -= 30
    if media_result["matched"]:
        aml_score -= 20
    if sof_result["risk_level"] == "HIGH":
        aml_score -= 20
    elif sof_result["risk_level"] == "MEDIUM":
        aml_score -= 10
        
    aml_score = max(0.0, aml_score)

    aml_row = models.AMLResult(
        user_id=payload.user_id,
        name_checked=payload.name,
        matched=sanctions_result["matched"],
        best_score=sanctions_result["best_score"],
        matched_entries=json.dumps(sanctions_result["matches"]),
        pep_matched=pep_result["matched"],
        pep_matches=json.dumps(pep_result["matches"]),
        adverse_media_flagged=media_result["matched"],
        adverse_media_hits=json.dumps(media_result["matches"]),
        sof_risk_level=sof_result["risk_level"],
        sof_reasoning=sof_result["reasoning"],
    )
    db.add(aml_row)

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "aml_checked"
        status_row.aml_flagged = is_flagged
        status_row.aml_score = aml_score
        decisioning.recompute_final_status(status_row)

    db.commit()

    return schemas.AMLScreenResponse(
        matched=sanctions_result["matched"],
        best_score=sanctions_result["best_score"],
        matches=sanctions_result["matches"],
        pep_matched=pep_result["matched"],
        pep_matches=pep_result["matches"],
        adverse_media_flagged=media_result["matched"],
        adverse_media_hits=media_result["matches"],
        sof_risk_level=sof_result["risk_level"],
        sof_reasoning=sof_result["reasoning"],
        checked_at=aml_row.checked_at,
    )
