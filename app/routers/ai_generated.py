from fastapi import APIRouter, File, UploadFile, HTTPException
import cv2
import numpy as np
import logging

from app.services.face_detection import detect_face
from app.services.ai_generated.predictor import predict_ai_generated

logger = logging.getLogger("ai_generated.router")

router = APIRouter(
    prefix="/ai-generated",
    tags=["AI Generated Detection"]
)


@router.post("/image")
async def detect_ai_generated(file: UploadFile = File(...)):

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG or PNG image."
        )

    image_bytes = await file.read()

    image_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    face_result = detect_face(image)

    if not face_result["face_found"]:
        raise HTTPException(
            status_code=400,
            detail="No face detected."
        )

    try:
        result = predict_ai_generated(
            face_result["face_image"]
        )
    except RuntimeError as exc:
        logger.error(f"AI-generated prediction failed: {exc}")
        raise HTTPException(
            status_code=503,
            detail="AI-generated image detection model is unavailable. "
                    "Check server startup logs -- it may still be downloading "
                    "from Hugging Face Hub, or failed to load."
        )

    return result