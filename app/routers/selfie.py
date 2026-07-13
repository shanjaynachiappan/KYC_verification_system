import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.face_detection import detect_face
from app.services.selfie_quality import (
    check_face_blur,
    check_face_overexposure
)


router = APIRouter(
    prefix="/selfie",
    tags=["Selfie"]
)


@router.post("/upload")
async def upload_selfie(file: UploadFile = File(...)):

    # Check file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    # Read uploaded selfie
    image_bytes = await file.read()

    # Convert bytes into NumPy array
    numpy_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    # Decode NumPy array into OpenCV image
    image = cv2.imdecode(
        numpy_array,
        cv2.IMREAD_COLOR
    )

    # Check whether image was decoded
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read selfie image"
        )

    # Detect face
    face_result = detect_face(image)

    # Reject if exactly one face is not found
    if not face_result["face_found"]:
        return {
            "status": "rejected",
            "message": "Exactly one face must be visible in the selfie.",
            "face_count": face_result["face_count"]
        }

    # Get cropped face image
    face_image = face_result["face_image"]

    # Check face blur
    blur_result = check_face_blur(face_image)

    # Reject if face is blurry
    if blur_result["is_blurry"]:
        return {
            "status": "rejected",
            "message": "Face image is blurry. Please retake the selfie.",
            "face_count": face_result["face_count"],
            "blur_score": blur_result["blur_score"],
            "blur_threshold": blur_result["threshold"]
        }

    # Check face overexposure
    overexposure_result = check_face_overexposure(
        face_image
    )

    # Reject if face is overexposed
    if overexposure_result["is_overexposed"]:
        return {
            "status": "rejected",
            "message": "Face is overexposed. Please retake the selfie in normal lighting.",
            "face_count": face_result["face_count"],
            "blur_score": blur_result["blur_score"],
            "bright_pixel_percentage": overexposure_result[
                "bright_pixel_percentage"
            ],
            "brightness_threshold": overexposure_result[
                "brightness_threshold"
            ],
            "pixel_percentage_threshold": overexposure_result[
                "pixel_percentage_threshold"
            ]
        }

    # Face passed all current quality checks
    return {
        "status": "accepted",
        "message": "Selfie passed face detection and quality checks.",
        "filename": file.filename,
        "face_count": face_result["face_count"],
        "blur_score": blur_result["blur_score"],
        "blur_threshold": blur_result["threshold"],
        "bright_pixel_percentage": overexposure_result[
            "bright_pixel_percentage"
        ],
        "brightness_threshold": overexposure_result[
            "brightness_threshold"
        ],
        "pixel_percentage_threshold": overexposure_result[
            "pixel_percentage_threshold"
        ]
    }