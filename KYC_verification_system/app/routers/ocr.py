import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.ocr_image_quality import (
    check_ocr_image_blur,
    check_ocr_image_overexposure
)

from app.services.ocr_service import extract_text_from_image


router = APIRouter(
    prefix="/ocr",
    tags=["OCR"]
)


@router.post("/upload")
async def upload_image_for_ocr(file: UploadFile = File(...)):

    # Check file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    # Read uploaded image
    image_bytes = await file.read()

    # Convert image bytes into NumPy array
    numpy_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    # Decode image using OpenCV
    image = cv2.imdecode(
        numpy_array,
        cv2.IMREAD_COLOR
    )

    # Check whether image was decoded successfully
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read uploaded image"
        )

    print("\n======================================")
    print("OCR IMAGE RECEIVED")
    print("Filename :", file.filename)
    print("======================================")

    # Check OCR image blur
    blur_result = check_ocr_image_blur(image)

    # Check OCR image overexposure
    overexposure_result = check_ocr_image_overexposure(
        image
    )

    # Run PaddleOCR
    ocr_result = extract_text_from_image(image)

    # Print final extracted text
    print("\n========== FINAL EXTRACTED TEXT ==========")

    if ocr_result["text_found"]:
        print(ocr_result["full_text"])
    else:
        print("NO READABLE TEXT FOUND")

    print("==========================================\n")

    # Reject only if OCR cannot find text
    if not ocr_result["text_found"]:
        return {
            "status": "rejected",
            "message": "No readable text detected in the uploaded image.",
            "blur_score": blur_result["blur_score"],
            "bright_pixel_percentage": overexposure_result[
                "bright_pixel_percentage"
            ]
        }

    # Return extracted OCR text
    return {
        "status": "success",
        "message": "Text extracted successfully.",
        "filename": file.filename,
        "blur_score": blur_result["blur_score"],
        "is_blurry": blur_result["is_blurry"],
        "bright_pixel_percentage": overexposure_result[
            "bright_pixel_percentage"
        ],
        "is_overexposed": overexposure_result[
            "is_overexposed"
        ],
        "extracted_text": ocr_result["extracted_text"],
        "full_text": ocr_result["full_text"]
    }