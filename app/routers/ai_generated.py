from fastapi import APIRouter, File, UploadFile, HTTPException
import cv2
import numpy as np

from app.services.face_detection import detect_face
from app.services.ai_generated.predictor import predict_ai_generated

router = APIRouter(
    prefix="/ai-generated",
    tags=["AI Generated Detection"]
)


@router.post("/image")
async def detect_ai_generated(file: UploadFile = File(...)):

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

    result = predict_ai_generated(
        face_result["face_image"]
    )

    return result