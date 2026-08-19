import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, aml, pep, adverse_media, sof, decisioning

router = APIRouter(prefix="/aml", tags=["aml"])


@router.post("/screen", response_model=schemas.AMLScreenResponse)
def screen(payload: schemas.AMLScreenRequest, db: Session = Depends(get_db)):
    """
    Runs after liveness/face-match. Screens the verified name against
    sanctions lists, PEP databases, and adverse media (all synthetic demo
    data), plus a simulated source-of-funds risk check.
    """
    user = db.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(404, "user not found")

    sanctions_result = aml.screen_name(payload.name)
    pep_result = pep.screen_pep(payload.name)
    media_result = adverse_media.check_adverse_media(payload.name)
    sof_result = sof.assess_source_of_funds(payload.user_id, payload.name)

    overall_flagged = (
        sanctions_result["matched"]
        or pep_result["matched"]
        or media_result["flagged"]
        or sof_result["risk_level"] == "high"
    )

    aml_row = models.AMLResult(
        user_id=payload.user_id,
        name_checked=payload.name,
        matched=sanctions_result["matched"],
        best_score=sanctions_result["best_score"],
        matched_entries=json.dumps(sanctions_result["matches"]),
        pep_matched=pep_result["matched"],
        pep_matches=json.dumps(pep_result["matches"]),
        adverse_media_flagged=media_result["flagged"],
        adverse_media_hits=json.dumps(media_result["hits"]),
        sof_risk_level=sof_result["risk_level"],
        sof_reasoning=sof_result["reasoning"],
    )
    db.add(aml_row)

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        status_row.state = "aml_checked"
        status_row.aml_flagged = overall_flagged
        decisioning.recompute_final_status(status_row)

    db.commit()

    return schemas.AMLScreenResponse(
        sanctions=sanctions_result,
        pep=pep_result,
        adverse_media=media_result,
        source_of_funds=sof_result,
        overall_flagged=overall_flagged,
        checked_at=aml_row.checked_at,
    )