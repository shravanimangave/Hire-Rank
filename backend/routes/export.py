import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models.db_models import AnalysisSession
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


@router.get("/{session_id}/csv")
def export_csv(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
    session_access_token: str | None = Depends(get_session_access_token),
):
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    _ensure_session_access(session, current_user, session_access_token)
    if session.status != "done":
        raise HTTPException(status_code=400, detail="Analysis not complete yet.")

    candidates = sorted(session.candidates, key=lambda c: c.final_score, reverse=True)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Rank", "Name", "Email", "Role", "Experience (yrs)",
        "Final Score", "Skill Match", "Experience Score", "Context Score",
        "Confidence", "Recommendation", "Strengths", "Missing Skills", "Risks",
        "AI Explanation",
    ])

    for rank, c in enumerate(candidates, 1):
        writer.writerow([
            rank,
            c.name,
            c.email or "",
            c.role or "",
            c.experience_years or "",
            round(c.final_score, 1),
            round(c.skill_match_score, 1),
            round(c.experience_score, 1),
            round(c.context_score, 1),
            round(c.confidence, 1),
            c.recommendation,
            "; ".join(c.strengths or []),
            "; ".join(c.missing_skills or []),
            "; ".join(c.risks or []),
            c.ai_explanation or "",
        ])

    output.seek(0)
    filename = f"hirecopilot_{session_id[:8]}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )



