from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    session_id: str
    message: str
    file_count: int
    session_access_token: str


# ── Analyze ───────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    session_id: str
    job_description: str
    job_title: Optional[str] = None


class AnalyzeResponse(BaseModel):
    session_id: str
    status: str
    candidate_count: int


# ── Candidate ─────────────────────────────────────────────────────────────────

class SkillScore(BaseModel):
    name: str
    score: float


class RadarPoint(BaseModel):
    category: str
    value: float


class CandidateOut(BaseModel):
    id: str
    session_id: str
    name: str
    email: Optional[str]
    role: Optional[str]
    experience: Optional[float]
    education: Optional[str]
    score: float
    skill_match_score: float
    experience_score: float
    context_score: float
    confidence: float
    recommendation: str
    strengths: List[str]
    missing_skills: List[str]
    risks: List[str]
    matched_skills: List[str]
    skills: List[SkillScore]
    radar_data: List[RadarPoint]
    ai_explanation: Optional[str]
    resume_filename: str

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: str
    job_title: Optional[str]
    job_description: str
    status: str
    created_at: datetime
    candidate_count: int

    class Config:
        from_attributes = True


# ── Results ───────────────────────────────────────────────────────────────────

class ResultsResponse(BaseModel):
    session: SessionOut
    candidates: List[CandidateOut]


# ── Export ────────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    session_id: str



