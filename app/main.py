from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import users, ekyc, pan, face, aml, status, selfie, ocr

# Creates kyc_demo.db and all tables on first run. Fine for a demo;
# in a real project you'd use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KYC/AML Demo -- Unified Identity Verification API",
    description=(
        "Single service combining OpenCV quality gates + PaddleOCR (Member A) "
        "with DigiLocker/PAN eKYC, DeepFace matching, AML screening, and "
        "orchestrator state (Member B)."
    ),
    version="1.0.0",
)

# Wide open for hackathon purposes -- lock this down before any real deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Orchestrator / eKYC / compliance routes
app.include_router(users.router)
app.include_router(ekyc.router)
app.include_router(pan.router)
app.include_router(face.router)
app.include_router(aml.router)
app.include_router(status.router)

# OpenCV quality-gate + OCR routes
app.include_router(selfie.router)
app.include_router(ocr.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "KYC/AML unified API is running",
    }
