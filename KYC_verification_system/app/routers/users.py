from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=schemas.UserCreateResponse)
def create_user(db: Session = Depends(get_db)):
    """Starts a new onboarding journey. Frontend calls this first, on Screen 1."""
    user = models.User()
    db.add(user)
    db.flush()

    status_row = models.VerificationStatus(user_id=user.id, state="started")
    db.add(status_row)

    db.commit()
    db.refresh(user)

    return schemas.UserCreateResponse(user_id=user.id, session_id=user.session_id)
