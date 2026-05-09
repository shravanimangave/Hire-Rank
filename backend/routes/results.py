from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models.db_models import AnalysisSession, Candidate
from backend.models.schemas import ResultsResponse, SessionOut, CandidateOut
from backend.routes.auth_deps import (
    get_current_user,
    get_session_access_token,
    has_session_access,
)
from backend.models.db_models import User

router = APIRouter()


def _ensure_session_access(
    session: AnalysisSession,
    current_user: User | None,
    session_access_token: str | None,
) -> None:
    if session.user_id:
        if not current_user or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this session.",
            )
        return
    if not has_session_access(session.id, session_access_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest session access token is missing or invalid.",
        )


def _candidate_out(c: Candidate) -> CandidateOut:
    return CandidateOut(
        id=c.id,
        session_id=c.session_id,
        name=c.name,
        email=c.email,
        role=c.role,
        experience=c.experience_years,
        education=c.education,
        score=c.final_score,
        skill_match_score=c.skill_match_score,
        experience_score=c.experience_score,
        context_score=c.context_score,
        confidence=c.confidence,
        recommendation=c.recommendation,
        strengths=c.strengths or [],
        missing_skills=c.missing_skills or [],
        risks=c.risks or [],
        matched_skills=c.matched_skills or [],
        skills=c.skill_breakdown or [],
        radar_data=c.radar_data or [],
        ai_explanation=c.ai_explanation,
        resume_filename=c.resume_filename,
    )


# NOTE: Fixed-path routes MUST be registered before the wildcard /{session_id}
# to prevent FastAPI from matching /candidate/... and /sessions/mine as session IDs.

@router.get("/sessions/mine")
def my_sessions(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """List all sessions belonging to the authenticated user."""
    if not current_user:
        return {"sessions": []}
    sessions = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_id == current_user.id)
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return {
        "sessions": [
            {
                "id": s.id,
                "job_title": s.job_title,
                "status": s.status,
                "created_at": s.created_at,
                "candidate_count": len(s.candidates),
            }
            for s in sessions
        ]
    }


@router.get("/candidate/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
    session_access_token: str | None = Depends(get_session_access_token),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    session = candidate.session
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    _ensure_session_access(session, current_user, session_access_token)
    return _candidate_out(candidate)


@router.get("/{session_id}", response_model=ResultsResponse)
def get_results(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
    session_access_token: str | None = Depends(get_session_access_token),
):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    _ensure_session_access(session, current_user, session_access_token)

    candidates = sorted(session.candidates, key=lambda c: c.final_score, reverse=True)

    session_out = SessionOut(
        id=session.id,
        job_title=session.job_title,
        job_description=session.job_description,
        status=session.status,
        created_at=session.created_at,
        candidate_count=len(candidates),
    )

    return ResultsResponse(
        session=session_out,
        candidates=[_candidate_out(c) for c in candidates],
    )



