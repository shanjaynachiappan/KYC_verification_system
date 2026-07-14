from fastapi import FastAPI

from app.routers.selfie import router as selfie_router
from app.routers.ocr import router as ocr_router


app = FastAPI(
    title="KYC Image Processing API",
    description="API for selfie quality validation and OCR text extraction",
    version="1.0.0"
)


# Connect OpenCV selfie processing routes
app.include_router(selfie_router)


# Connect PaddleOCR routes
app.include_router(ocr_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "KYC Image Processing API is running"
    }