from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ---------- Users ----------
class UserCreateResponse(BaseModel):
    user_id: str
    session_id: str


# ---------- DigiLocker / eKYC ----------
class DigilockerInitResponse(BaseModel):
    request_id: str
    redirect_url: str


class DigilockerStatusResponse(BaseModel):
    request_id: str
    consent_status: str


class AadhaarFetchResponse(BaseModel):
    name: Optional[str]
    dob: Optional[str]
    address: Optional[str]
    photo_base64: Optional[str]
    id_number_masked: Optional[str]
    fetched_at: datetime


# ---------- PAN ----------
class PANVerifyRequest(BaseModel):
    user_id: str
    pan: str
    reason: Optional[str] = "Identity verification during onboarding"


class PANVerifyResponse(BaseModel):
    valid: bool
    full_name: Optional[str] = None
    category: Optional[str] = None
    aadhaar_seeding_status: Optional[str] = None
    message: str
    verified_at: datetime


# ---------- Cross-check: Aadhaar name (from DigiLocker) vs PAN name (from Setu PAN API) ----------
class CrossCheckRequest(BaseModel):
    user_id: str


class CrossCheckResponse(BaseModel):
    matched: bool
    name_similarity: float
    aadhaar_name: Optional[str]
    pan_name: Optional[str]
    checked_at: datetime


# ---------- Face match: selfie vs Aadhaar photo fetched from DigiLocker ----------
class FaceMatchRequest(BaseModel):
    user_id: str
    selfie_base64: str  # raw base64 image data from the browser camera capture


class FaceMatchResponse(BaseModel):
    matched: bool
    similarity_score: float
    quality_issue: Optional[str] = None
    checked_at: datetime


# ---------- AML ----------
class AMLScreenRequest(BaseModel):
    user_id: str
    name: str


class AMLMatchEntry(BaseModel):
    matched_name: str
    score: float
    topics: Optional[str] = None
    source_dataset: Optional[str] = None


class AMLScreenResponse(BaseModel):
    matched: bool
    best_score: float
    matches: List[AMLMatchEntry]
    checked_at: datetime


# ---------- Orchestrator status ----------
class StatusResponse(BaseModel):
    user_id: str
    state: str
    cross_check_passed: Optional[bool]
    face_match_passed: Optional[bool]
    aml_flagged: Optional[bool]
    final_status: Optional[str]
    updated_at: datetime


class UserStatusSummary(BaseModel):
    user_id: str
    state: str
    final_status: Optional[str]
    updated_at: datetime
