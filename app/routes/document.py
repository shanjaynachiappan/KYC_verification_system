import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.document_quality import (
    check_document_blur,
    check_document_overexposure
)

from app.services.ocr_service import extract_text_from_document

from app.services.document_parser import (
    identify_document,
    extract_person_details
)


router = APIRouter(
    prefix="/document",
    tags=["Document"]
)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    # Check file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    # Read uploaded document image
    image_bytes = await file.read()

    # Convert image bytes into NumPy array
    numpy_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    # Decode NumPy array into OpenCV image
    image = cv2.imdecode(
        numpy_array,
        cv2.IMREAD_COLOR
    )

    # Check whether image was decoded successfully
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read document image"
        )

    # Check document blur
    blur_result = check_document_blur(image)

    # Reject blurry document
    if blur_result["is_blurry"]:
        return {
            "status": "rejected",
            "message": "Document image is blurry. Please upload a clear document image.",
            "blur_score": blur_result["blur_score"],
            "blur_threshold": blur_result["threshold"]
        }

    # Check document overexposure
    overexposure_result = check_document_overexposure(image)

    # Reject overexposed document
    if overexposure_result["is_overexposed"]:
        return {
            "status": "rejected",
            "message": "Document is overexposed. Please upload the document in normal lighting.",
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

    # Extract text using PaddleOCR
    ocr_result = extract_text_from_document(image)

    # Reject if no text is found
    if not ocr_result["text_found"]:
        return {
            "status": "rejected",
            "message": "No text detected in the uploaded image."
        }

    # Identify Aadhaar or PAN
    document_result = identify_document(
        ocr_result["full_text"]
    )

    # Reject unsupported document
    if not document_result["is_supported"]:
        return {
            "status": "rejected",
            "message": "Unsupported document. Only Aadhaar or PAN documents are allowed.",
            "document_type": document_result["document_type"]
        }

    # Extract name, DOB and gender
    person_result = extract_person_details(
        ocr_result["full_text"],
        document_result["document_type"]
    )

    # Document accepted
    return {
        "status": "success",
        "message": "Document verified and details extracted successfully.",
        "filename": file.filename,
        "document_type": document_result["document_type"],
        "document_number": document_result["document_number"],
        "name": person_result["name"],
        "date_of_birth": person_result["date_of_birth"],
        "gender": person_result["gender"],
        "blur_score": blur_result["blur_score"],
        "bright_pixel_percentage": overexposure_result[
            "bright_pixel_percentage"
        ],
        "extracted_text": ocr_result["extracted_text"],
        "full_text": ocr_result["full_text"]
    }