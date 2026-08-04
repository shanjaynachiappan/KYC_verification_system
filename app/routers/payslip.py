from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2
import numpy as np

from app.services.ocr_image_quality import check_image_quality
from app.services.ocr_service import extract_text_from_image
from app.services.payslip_validator import validate_payslip
from app.services.payslip_extractor import extract_payslip_details

router = APIRouter(
    prefix="/payslip",
    tags=["Payslip OCR"]
)


@router.post("/extract")
async def extract_payslip(file: UploadFile = File(...)):

    try:

        # ---------------------------------------
        # Read Image
        # ---------------------------------------

        image_bytes = await file.read()

        image = cv2.imdecode(
            np.frombuffer(image_bytes, np.uint8),
            cv2.IMREAD_COLOR
        )

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image."
            )

        # ---------------------------------------
        # Image Quality Check
        # ---------------------------------------

        quality_result = check_image_quality(image)

        if not quality_result["is_valid"]:

            return {

                "success": False,

                "stage": "image_quality",

                "message": "Image quality check failed.",

                "quality_result": quality_result

            }

        # ---------------------------------------
        # OCR
        # ---------------------------------------

        ocr_result = extract_text_from_image(image)

        if not ocr_result["text_found"]:

            return {

                "success": False,

                "stage": "ocr",

                "message": "No readable text found."

            }

        extracted_text = ocr_result["extracted_text"]

        # ---------------------------------------
        # Payslip Validation
        # ---------------------------------------

        validation = validate_payslip(extracted_text)

        if not validation["is_valid"]:

            return {

                "success": False,

                "document_type": "payslip",

                "validation": validation

            }

        # ---------------------------------------
        # Extract Payslip Details
        # ---------------------------------------

        extracted_data = extract_payslip_details(
            extracted_text
        )

        return {

            "success": True,

            "document_type": "payslip",

            "quality_result": quality_result,

            "ocr": ocr_result,

            "validation": validation,

            "data": extracted_data

        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )