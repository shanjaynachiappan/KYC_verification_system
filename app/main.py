from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import users, ekyc, aml, status, pan, face, selfie, document

# Creates kyc_demo.db and all tables on first run. Fine for a demo;
# in a real project you'd use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KYC Verification API",
    description="Combined KYC platform: eKYC/AML/PAN/Face-match (Member B) + selfie/document quality+OCR (Member A)",
    version="1.0.0",
)

# Wide open for hackathon purposes -- lock this down before any real deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(ekyc.router)
app.include_router(pan.router)
app.include_router(face.router)
app.include_router(aml.router)
app.include_router(status.router)
app.include_router(selfie.router)
app.include_router(document.router)


@app.get("/health")
def health():
    return {"status": "ok", "message": "KYC Verification API is running"}