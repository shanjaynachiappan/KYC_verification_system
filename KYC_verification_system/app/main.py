from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import users, ekyc, pan, face, aml, status, selfie, ocr, review
from app.routers import passport, payslip, deepfake, ai_generated, liveness, kyb

from app.services.deepfake.model_loader import load_model as load_deepfake_model
from app.services.ai_generated.model_loader import load_model as load_ai_generated_model

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
app.include_router(liveness.router)
app.include_router(aml.router)
app.include_router(status.router)
app.include_router(review.router)
app.include_router(kyb.router)

# OpenCV quality-gate + OCR routes
app.include_router(selfie.router)
app.include_router(ocr.router)

# Document-specific OCR (passport/payslip) + AI detection routes
app.include_router(passport.router)
app.include_router(payslip.router)
app.include_router(deepfake.router)
app.include_router(ai_generated.router)


@app.on_event("startup")
async def load_ai_models():
    """
    Loads the deepfake + AI-generated-image detection models once at startup.

    Deliberately NOT allowed to crash the whole API: the deepfake model
    needs a local weights file (app/services/deepfake/weights/xception_ffpp.pth)
    that isn't in source control. If it's missing, /deepfake/image will 503
    at call time instead of the entire API failing to start -- every other
    endpoint (users/ekyc/pan/aml/face/status/review/ocr/passport/payslip)
    keeps working regardless.
    """
    print("\n====================================")
    print("Loading AI Models...")
    print("====================================")

    try:
        load_deepfake_model()
        print("Deepfake detection model loaded.")
    except Exception as exc:
        print(f"WARNING: deepfake model failed to load ({exc}). "
              f"/deepfake/image will return an error until the weights file is added.")

    try:
        load_ai_generated_model()
        print("AI-generated-image detection model loaded (or already cached).")
    except Exception as exc:
        print(f"WARNING: ai-generated model failed to load ({exc}). "
              f"/ai-generated/image will return an error until this is resolved "
              f"(needs internet access on first run to download from Hugging Face Hub).")

    print("====================================\n")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "KYC/AML unified API is running",
    }
