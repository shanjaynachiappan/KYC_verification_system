import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    """One row per person going through the onboarding journey."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    session_id = Column(String, unique=True, index=True, default=gen_id)
    created_at = Column(DateTime, default=datetime.utcnow)

    digilocker_requests = relationship("DigilockerRequest", back_populates="user")
    documents = relationship("Document", back_populates="user")
    aml_results = relationship("AMLResult", back_populates="user")
    status = relationship("VerificationStatus", back_populates="user", uselist=False)


class DigilockerRequest(Base):
    """Tracks a single Setu DigiLocker consent request end-to-end."""
    __tablename__ = "digilocker_requests"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"))
    setu_request_id = Column(String, index=True)   # id returned by Setu
    redirect_url = Column(Text)                    # url we send the user to
    consent_status = Column(String, default="unauthenticated")  # unauthenticated / authenticated / expired
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="digilocker_requests")


class Document(Base):
    """
    Stores verified identity data.
    source = 'digilocker' (real, fetched from Setu) or 'ocr' (from Member A's endpoint,
    passed to us for cross-check).
    """
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"))
    doc_type = Column(String)          # AADHAAR / PAN
    source = Column(String)            # digilocker / ocr
    name = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    id_number_masked = Column(String, nullable=True)
    photo_base64 = Column(Text, nullable=True)   # only present for digilocker Aadhaar fetch
    raw_response = Column(Text, nullable=True)   # full JSON, for debugging/demo transparency
    fetched_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")


class AMLResult(Base):
    """Result of screening a name against the OpenSanctions dataset."""
    __tablename__ = "aml_results"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"))
    name_checked = Column(String)
    matched = Column(Boolean, default=False)
    best_score = Column(Float, default=0.0)
    matched_entries = Column(Text, nullable=True)  # JSON list of {name, score, topics, source}
    checked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="aml_results")


class VerificationStatus(Base):
    """
    Single source of truth for 'where is this user in the journey right now'.
    This is the orchestrator state Member C's dashboard polls.
    """
    __tablename__ = "verification_status"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    state = Column(String, default="started")
    # started -> ekyc_done -> cross_checked -> face_matched/face_match_failed -> aml_checked -> verified / flagged
    cross_check_passed = Column(Boolean, nullable=True)
    face_match_passed = Column(Boolean, nullable=True)
    aml_flagged = Column(Boolean, nullable=True)
    final_status = Column(String, nullable=True)  # verified / flagged / pending
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="status")
