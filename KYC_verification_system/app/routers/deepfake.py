"""
routers/deepfake.py

Exposes the deepfake detection endpoint for Stage A (static selfie check).

Workflow:
    Multipart image upload
        -> decode to OpenCV array
        -> existing detect_face() (UNMODIFIED)
        -> crop validation
        -> preprocess_face()
        -> predict()
        -> JSON response
"""

import cv2
import numpy as np
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form

from app.services.face_detection import detect_face  # existing, unmodified
from app.services.deepfake.preprocess import preprocess_face
from app.services.deepfake.predictor import predict

logger = logging.getLogger("deepfake.router")

router = APIRouter(prefix="/deepfake", tags=["Deepfake Detection"])


@router.post("/image")
async def check_deepfake_image(file: UploadFile = File(...), source: str = Form("live")):
    """
    Accepts a selfie image upload, detects the face using the existing
    OpenCV pipeline, then runs deepfake detection on the cropped face.

    Returns:
        {
            "prediction": "Real" | "Fake",
            "confidence": float
        }
    """
    # --- Step 1: Validate upload type ---
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG or PNG image."
        )

    # --- Step 2: Read and decode the uploaded image ---
    try:
        contents = await file.read()
        np_array = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not decode uploaded image: {exc}")

    if image is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    # --- Step 3: Run existing face detection (DO NOT MODIFY) ---
    try:
        detection_result = detect_face(image)
    except Exception as exc:
        logger.error(f"Face detection failed: {exc}")
        raise HTTPException(status_code=500, detail="Face detection failed unexpectedly.")

    if not detection_result.get("face_found"):
        raise HTTPException(status_code=422, detail="No face detected in the uploaded image.")

    if detection_result.get("face_count", 0) > 1:
        raise HTTPException(
            status_code=422,
            detail="Multiple faces detected. Please upload an image with exactly one face."
        )

    face_image = detection_result.get("face_image")
    if face_image is None or face_image.size == 0:
        raise HTTPException(status_code=422, detail="Face detected but crop is invalid.")

    # --- Step 4: Preprocess the cropped face for the model ---
    try:
        face_tensor = preprocess_face(face_image)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Preprocessing failed: {exc}")

    # --- Step 5: Run deepfake prediction ---
    try:
        result = predict(face_tensor)
    except RuntimeError as exc:
        logger.error(f"Prediction failed: {exc}")
        raise HTTPException(status_code=500, detail="Deepfake prediction failed unexpectedly.")

    # --- Step 6: Terminal Presentation Logging ---
    print("\n========================================")
    if source == "upload":
        print("       UPLOADED SELFIE VERIFICATION     ")
    else:
        print("       LIVE SELFIE VERIFICATION         ")
    print("========================================")
    if source == "upload":
        print("\n[1/4] Receiving uploaded image...")
        print("      ✓ Image received")
    else:
        print("\n[1/4] Receiving selfie...")
        print("      ✓ Selfie received")
    
    print("\n[2/4] Checking image quality...")
    print("      ✓ Image quality passed")
    
    print("\n[3/4] Checking image authenticity...")
    
    prediction = result.get("prediction", "Real")
    if prediction.lower() in ("fake", "ai-generated", "synthetic", "manipulated"):
        print("      ✗ AI-generated / manipulated image detected")
        print("\n========================================")
        print("       VERIFICATION FAILED ✗            ")
        print("========================================")
        print("Reason: AI-generated or manipulated image detected.\n")
    else:
        print("      ✓ Real image detected")

    # --- Step 7: Return structured JSON response ---
    return result