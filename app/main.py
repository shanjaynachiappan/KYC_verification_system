from fastapi import FastAPI

# Routers
from app.routers.selfie import router as selfie_router
from app.routers.passport import router as passport_router
from app.routers.payslip import router as payslip_router
from app.routers.deepfake import router as deepfake_router
from app.routers.ai_generated import router as ai_generated_router

# Model Loaders
from app.services.deepfake.model_loader import load_model as load_deepfake_model
from app.services.ai_generated.model_loader import load_model as load_ai_generated_model

app = FastAPI(
    title="KYC Image Processing API",
    description="API for Selfie Verification, Passport OCR, Payslip OCR, Deepfake Detection and AI Generated Image Detection",
    version="3.0.0"
)

# ==========================
# Register Routers
# ==========================

app.include_router(selfie_router)
app.include_router(passport_router)
app.include_router(payslip_router)
app.include_router(deepfake_router)
app.include_router(ai_generated_router)

# ==========================
# Startup Event
# ==========================

@app.on_event("startup")
async def startup_event():
    print("\n====================================")
    print("Loading AI Models...")
    print("====================================")

    load_deepfake_model()
    load_ai_generated_model()

    print("====================================")
    print("All AI Models Loaded Successfully ✅")
    print("====================================\n")


# ==========================
# Root Endpoint
# ==========================

@app.get("/")
def root():
    return {
        "message": "KYC Image Processing API is Running"
    }


# ==========================
# Health Check
# ==========================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "KYC Image Processing API is running"
    }