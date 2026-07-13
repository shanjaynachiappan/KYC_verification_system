from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/status", tags=["status"])


@router.get("/{user_id}", response_model=schemas.StatusResponse)
def get_status(user_id: str, db: Session = Depends(get_db)):
    """
    Screen 5 (Result Dashboard) and Screen 8 (Admin Overview) poll this.
    Single source of truth for 'where is this user right now'.
    """
    status_row = db.query(models.VerificationStatus).filter_by(user_id=user_id).first()
    if not status_row:
        raise HTTPException(404, "user not found")

    return schemas.StatusResponse(
        user_id=user_id,
        state=status_row.state,
        cross_check_passed=status_row.cross_check_passed,
        face_match_passed=status_row.face_match_passed,
        aml_flagged=status_row.aml_flagged,
        final_status=status_row.final_status,
        updated_at=status_row.updated_at,
    )


@router.get("/", response_model=List[schemas.UserStatusSummary])
def list_all_statuses(db: Session = Depends(get_db)):
    """Backs the Admin Overview screen - list of every demo user run so far."""
    rows = db.query(models.VerificationStatus).all()
    return [
        schemas.UserStatusSummary(
            user_id=r.user_id,
            state=r.state,
            final_status=r.final_status,
            updated_at=r.updated_at,
        )
        for r in rows
    ]
