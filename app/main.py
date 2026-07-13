from fastapi import FastAPI

from app.routes.selfie import router as selfie_router
from app.routes.document import router as document_router


app = FastAPI(
    title="KYC Verification API",
    description="API for selfie quality validation and document OCR",
    version="1.0.0"
)


# Connect selfie API routes
app.include_router(selfie_router)


# Connect document OCR API routes
app.include_router(document_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "KYC Verification API is running"
    }