from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text,
    DateTime, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from backend.database.db import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    sessions = relationship("AnalysisSession", back_populates="user", cascade="all, delete")


class AnalysisSession(Base):
    """One upload batch = one session."""
    __tablename__ = "analysis_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # nullable = guest
    job_description = Column(Text, nullable=False)
    job_title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending | processing | done | error

    user = relationship("User", back_populates="sessions")
    candidates = relationship("Candidate", back_populates="session", cascade="all, delete")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("analysis_sessions.id"), nullable=False)

    # Identity
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)
    experience_years = Column(Float, nullable=True)
    education = Column(String, nullable=True)

    # Raw resume text
    resume_filename = Column(String, nullable=False)
    resume_text = Column(Text, nullable=False)

    # Scores (all 0–100)
    final_score = Column(Float, nullable=False, default=0.0)
    skill_match_score = Column(Float, nullable=False, default=0.0)
    experience_score = Column(Float, nullable=False, default=0.0)
    context_score = Column(Float, nullable=False, default=0.0)
    confidence = Column(Float, nullable=False, default=0.0)

    # Recommendation: shortlist | maybe | reject
    recommendation = Column(String, nullable=False, default="reject")

    # AI analysis (stored as JSON arrays/objects)
    strengths = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    matched_skills = Column(JSON, default=list)
    skill_breakdown = Column(JSON, default=list)   # [{name, score}]
    radar_data = Column(JSON, default=list)         # [{category, value}]
    ai_explanation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AnalysisSession", back_populates="candidates")



