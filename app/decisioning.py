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

    # Hard-fail conditions -- flag immediately even if other checks haven't run yet
    if cc is False or fm is False:
        status_row.final_status = "flagged"
        status_row.state = "flagged"
        return

    # All three checks must have completed (non-None) before we can call it verified/pending
    if cc is None or fm is None or aml is None:
        # still in progress -- don't overwrite state here, the calling router already
        # set an appropriate in-progress state (e.g. "cross_checked", "face_matched")
        status_row.final_status = None
        return

    if aml is True:
        status_row.final_status = "pending"
        status_row.state = "pending"
        return

    # cc == True, fm == True, aml == False
    status_row.final_status = "verified"
    status_row.state = "verified"
