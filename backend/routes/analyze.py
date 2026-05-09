from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.db import get_db, SessionLocal
from backend.models.db_models import AnalysisSession, Candidate
from backend.models.schemas import AnalyzeRequest, AnalyzeResponse
from backend.routes.auth_deps import (
    get_current_user,
    get_session_access_token,
    has_session_access,
)
from backend.models.db_models import User
from backend.config import settings

from backend.core.parser import parse_resume
from backend.core.scorer import (
    skill_match_score,
    experience_depth_score,
    context_quality_score,
    compute_final_score,
    skill_breakdown,
    compute_confidence,
    extract_jd_skills,
)
from backend.core.ranker import (
    build_radar_data,
    determine_recommendation,
    extract_strengths,
    extract_risks,
)
from backend.core.explain import generate_explanation

router = APIRouter()
UPLOAD_DIR = Path(settings.UPLOAD_DIR)


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


def _run_pipeline(session_id: str):
    """Full AI pipeline — runs in a background task with its own DB session."""
    # IMPORTANT: We open a fresh session here because FastAPI closes the
    # request-scoped session before background tasks execute.
    db: Session = SessionLocal()
    try:
        session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
        if not session:
            return

        session.status = "processing"
        db.query(Candidate).filter(Candidate.session_id == session_id).delete(
            synchronize_session=False
        )
        db.commit()

        try:
            session_dir = UPLOAD_DIR / session_id
            pdf_files = list(session_dir.glob("*.pdf"))

            if not pdf_files:
                print(f"[analyze] No PDF files found in {session_dir}")
                session.status = "error"
                db.commit()
                return

            jd_text = session.job_description
            jd_skills = extract_jd_skills(jd_text)

            for pdf_path in pdf_files:
                try:
                    parsed = parse_resume(str(pdf_path))

                    # Score
                    sm_score, matched, missing = skill_match_score(parsed["raw_text"], jd_text)
                    exp_score = experience_depth_score(
                        parsed["experience_text"], parsed["experience_years"]
                    )
                    ctx_score = context_quality_score(parsed["raw_text"])
                    final = compute_final_score(sm_score, exp_score, ctx_score)
                    confidence = compute_confidence(final, matched, jd_skills, parsed["experience_years"])

                    # Rank
                    rec = determine_recommendation(final, missing)
                    strengths = extract_strengths(parsed["raw_text"], matched)
                    risks = extract_risks(parsed["raw_text"], missing, parsed["experience_years"])
                    radar = build_radar_data(
                        parsed["raw_text"], sm_score, exp_score, ctx_score, parsed["experience_years"]
                    )
                    breakdown = skill_breakdown(jd_text, parsed["raw_text"])

                    # Explain
                    explanation = generate_explanation(
                        name=parsed["name"],
                        final_score=final,
                        skill_score=sm_score,
                        experience_score=exp_score,
                        context_score=ctx_score,
                        matched_skills=matched,
                        missing_skills=missing,
                        strengths=strengths,
                        risks=risks,
                        years=parsed["experience_years"],
                        recommendation=rec,
                        confidence=confidence,
                    )

                    candidate = Candidate(
                        session_id=session_id,
                        name=parsed["name"],
                        email=parsed["email"],
                        role=parsed["role"],
                        experience_years=parsed["experience_years"],
                        education=parsed["education"],
                        resume_filename=pdf_path.name,
                        resume_text=parsed["raw_text"][:5000],  # store excerpt
                        final_score=final,
                        skill_match_score=sm_score,
                        experience_score=exp_score,
                        context_score=ctx_score,
                        confidence=confidence,
                        recommendation=rec,
                        strengths=strengths,
                        missing_skills=missing,
                        risks=risks,
                        matched_skills=matched,
                        skill_breakdown=breakdown,
                        radar_data=radar,
                        ai_explanation=explanation,
                    )
                    db.add(candidate)

                except Exception as e:
                    # Log and continue — one bad PDF shouldn't kill the session
                    print(f"[analyze] Error processing {pdf_path.name}: {e}")
                    continue

            session.status = "done"
            db.commit()

        except Exception as e:
            print(f"[analyze] Pipeline error: {e}")
            session.status = "error"
            db.commit()

    finally:
        db.close()


@router.post("", response_model=AnalyzeResponse)
def analyze(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
    session_access_token: str | None = Depends(get_session_access_token),
):
    session = db.query(AnalysisSession).filter(
        AnalysisSession.id == payload.session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    _ensure_session_access(session, current_user, session_access_token)

    if session.status == "processing":
        raise HTTPException(status_code=409, detail="Analysis already running.")

    # Update JD if provided (in case user edited it)
    if payload.job_description:
        session.job_description = payload.job_description
    if payload.job_title:
        session.job_title = payload.job_title
    db.commit()

    # Run in background so the HTTP response returns immediately
    background_tasks.add_task(_run_pipeline, payload.session_id)

    return AnalyzeResponse(
        session_id=session.id,
        status="processing",
        candidate_count=0,
    )


@router.get("/status/{session_id}")
def analysis_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
    session_access_token: str | None = Depends(get_session_access_token),
):
    """Poll this endpoint until status == 'done'."""
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    _ensure_session_access(session, current_user, session_access_token)
    candidate_count = len(session.candidates)
    return {
        "session_id": session_id,
        "status": session.status,
        "candidate_count": candidate_count,
    }



