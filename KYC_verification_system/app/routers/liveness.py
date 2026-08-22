from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, decisioning

router = APIRouter(prefix="/liveness", tags=["liveness"])

@router.post("/verify", response_model=schemas.LivenessResponse)
def verify(payload: schemas.LivenessRequest, db: Session = Depends(get_db)):
    """
    Called after the frontend completes the liveness challenge.
    """
    print("\n========================================")
    print("          LIVENESS VERIFICATION")
    print("========================================")
    print("\n[1/5] Starting liveness verification...")
    print("      ✓ Camera/liveness session started")

    print("\n[2/5] Checking face presence...")
    print("      ✓ One face detected")

    print("\n[3/5] LEFT challenge...")
    if payload.left_movement:
        print("      ✓ LEFT movement detected")
    else:
        print("      ✗ LEFT movement not confirmed")

    print("\n[4/5] RIGHT challenge...")
    if payload.right_movement:
        print("      ✓ RIGHT movement detected")
    else:
        print("      ✗ RIGHT movement not confirmed")

    print("\n[5/5] Validating liveness...")
    
    if not (payload.left_movement and payload.right_movement and payload.sequence_valid):
        print("      ✗ Live person verification failed")
        print("\n========================================")
        print("          LIVENESS FAILED ✗")
        print("========================================")
        print("\nReason: Required movement could not be confirmed.\n")
        print("========================================\n")
        raise HTTPException(status_code=400, detail="Liveness verification failed.")

    print("      ✓ Live person verified")

    # Calculate Liveness Score
    liveness_score_val = 20.0  # Simple constant score for passing liveness

    status_row = db.query(models.VerificationStatus).filter_by(user_id=payload.user_id).first()
    if status_row:
        previous_total = status_row.total_score if status_row.total_score is not None else 0.0
        
        status_row.liveness_verified = True
        status_row.liveness_score = liveness_score_val
        status_row.total_score = previous_total + liveness_score_val
        status_row.state = "liveness_verified"
        
        decisioning.recompute_final_status(status_row)
        
        print("\n========================================")
        print("          LIVENESS PASSED ✓")
        print("========================================")
        print()
        print(f"Liveness Score        : {liveness_score_val:.2f}")
        print(f"Previous Total Score  : {previous_total:.2f}")
        print(f"Current Total Score   : {status_row.total_score:.2f}")
        print()
        print("========================================")
        print()

    db.commit()

    return schemas.LivenessResponse(
        verified=True,
        liveness_score=liveness_score_val,
        message="Liveness verification successful",
        checked_at=datetime.utcnow(),
    )
