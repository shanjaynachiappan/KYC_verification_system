"""
Compares a live selfie against the Aadhaar photo fetched from DigiLocker.

Two libraries doing two different jobs:
  - OpenCV (via app/face_detection.py + app/selfie_quality.py, contributed by
      Member A): cheap pre-checks BEFORE running the heavy model -- is there
      exactly one face in this image? Is it blurry? Is it overexposed/glared?
  - DeepFace (ArcFace model under the hood): converts both faces into
      embedding vectors and computes similarity -- this is the real match.

DeepFace downloads the ArcFace model weights (~100MB) on first run and
caches them locally afterwards -- the first call will be slow, subsequent
calls are fast.
"""
import base64
import tempfile
from pathlib import Path

import cv2
from deepface import DeepFace

from app.services.face_detection import detect_face
from app.services.selfie_quality import check_face_blur, check_face_overexposure


def _decode_base64_to_tempfile(b64_string: str) -> str:
    """Aadhaar photo / selfie both arrive as base64 strings -- write to a temp
    file since DeepFace's API expects file paths."""
    if "," in b64_string:  # strip a possible "data:image/jpeg;base64," prefix
        b64_string = b64_string.split(",", 1)[1]

    img_bytes = base64.b64decode(b64_string)
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    tmp.write(img_bytes)
    tmp.close()
    return tmp.name


def check_image_quality(image_path: str) -> str | None:
    """
    Cheap OpenCV checks that run before the expensive face-match model.
    Returns None if the image is fine, or a short reason string if not.

    Pipeline (all from Member A's face_detection.py / selfie_quality.py):
      1. detect_face()          -- exactly one face? (minSize=100x100, stricter
                                     than a naive Haar-cascade call, cuts down
                                     false "multiple faces" hits on hi-res selfies)
      2. check_face_blur()      -- runs on the CROPPED FACE, not the whole image
                                     (more accurate than checking the whole frame)
      3. check_face_overexposure() -- the "glare" check
    """
    img = cv2.imread(image_path)
    if img is None:
        return "IMAGE_UNREADABLE"

    face_result = detect_face(img)
    if not face_result["face_found"]:
        return "NO_FACE_DETECTED" if face_result["face_count"] == 0 else "MULTIPLE_FACES_DETECTED"

    face_image = face_result["face_image"]

    blur_result = check_face_blur(face_image)
    if blur_result["is_blurry"]:
        return "IMAGE_TOO_BLURRY"

    exposure_result = check_face_overexposure(face_image)
    if exposure_result["is_overexposed"]:
        return "IMAGE_OVEREXPOSED"

    return None


def match_faces(selfie_b64: str, aadhaar_photo_b64: str, threshold: float = 0.68) -> dict:
    """
    Returns {"matched": bool, "similarity_score": float, "quality_issue": str|None}
    threshold is DeepFace's cosine-distance cutoff for ArcFace -- lower distance
    means a closer match, so "matched" is True when distance is BELOW threshold.
    """
    selfie_path = _decode_base64_to_tempfile(selfie_b64)
    aadhaar_path = _decode_base64_to_tempfile(aadhaar_photo_b64)

    try:
        quality_issue = check_image_quality(selfie_path)
        if quality_issue:
            return {"matched": False, "similarity_score": 0.0, "quality_issue": quality_issue}

        result = DeepFace.verify(
            img1_path=selfie_path,
            img2_path=aadhaar_path,
            model_name="ArcFace",
            distance_metric="cosine",
            enforce_detection=True,
        )
        # DeepFace returns 'distance' (lower = more similar) and 'verified' (bool, using its own threshold)
        # We convert distance to an intuitive 0-1 "similarity" score for the frontend.
        similarity_score = round(max(0.0, 1 - result["distance"]), 4)

        return {
            "matched": bool(result["verified"]),
            "similarity_score": similarity_score,
            "quality_issue": None,
        }
    except ValueError:
        # DeepFace raises ValueError when it can't detect a face in one of the images
        return {"matched": False, "similarity_score": 0.0, "quality_issue": "FACE_NOT_DETECTED_BY_MODEL"}
    finally:
        Path(selfie_path).unlink(missing_ok=True)
        Path(aadhaar_path).unlink(missing_ok=True)