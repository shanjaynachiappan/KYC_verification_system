"""
Single place that decides 'verified' / 'flagged' / 'pending' / None once enough
checks have run. Called from ekyc.py, face.py, and aml.py routers after each
one updates its own field on VerificationStatus, so the final decision is
always recomputed from the full picture regardless of which check finishes last.

Decision logic:
  - cross_check_passed == False  -> flagged   (Aadhaar/PAN name mismatch is a hard stop)
  - face_match_passed == False   -> flagged   (selfie doesn't match Aadhaar photo)
  - aml_flagged == True          -> pending   (sanctions/PEP hit needs a human to review,
                                                 not an auto-reject -- see AML row in the
                                                 original module table: PEP/adverse-media
                                                 hits specifically require Enhanced Due
                                                 Diligence, not outright rejection)
  - all three checks done and all clean -> verified
  - not all three checks have run yet    -> state reflects progress, final_status stays None
"""
from app import models


def recompute_final_status(status_row: "models.VerificationStatus") -> None:
    cc = status_row.cross_check_passed
    fm = status_row.face_match_passed
    aml = status_row.aml_flagged
    lv = status_row.liveness_verified

    # Calculate total score from individual scores
    total_score = 0.0
    if status_row.face_match_score:
        total_score += status_row.face_match_score
    if status_row.liveness_score:
        total_score += status_row.liveness_score
    if status_row.aml_score:
        total_score += status_row.aml_score
        
    status_row.total_score = total_score
    print(f"AML Score: {status_row.aml_score} | Total Score: {total_score}")

    # Hard-fail conditions
    if cc is False:
        status_row.final_status = "flagged"
        status_row.state = "flagged"
        return

    # All checks must have completed (non-None)
    if cc is None or fm is None or aml is None or lv is None:
        status_row.final_status = None
        return

    if aml is True:
        status_row.final_status = "pending"
        status_row.state = "pending"
        return

    # Use liveness and total score for final check
    if lv is False or total_score < 180:  # Arbitrary threshold to require mostly passing scores (out of max 300)
        status_row.final_status = "flagged"
        status_row.state = "flagged"
        return

    status_row.final_status = "verified"
    status_row.state = "verified"
