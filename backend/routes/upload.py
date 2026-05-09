import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.models.db_models import AnalysisSession
from backend.models.schemas import UploadResponse
from backend.routes.auth_deps import create_session_access_token, get_current_user
from backend.models.db_models import User
from backend.config import settings

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/resumes", response_model=UploadResponse)
async def upload_resumes(
    files: List[UploadFile] = File(...),
    job_description: str = Form(...),
    job_title: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    # Validate files
    for f in files:
        if f.content_type not in ("application/pdf",):
            raise HTTPException(status_code=400, detail=f"{f.filename} is not a PDF.")

    buffered_files: list[tuple[str, bytes]] = []
    for upload in files:
        content = await upload.read()
        if len(content) > MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"{upload.filename} exceeds {settings.MAX_FILE_SIZE_MB}MB limit.",
            )
        buffered_files.append((upload.filename or f"{uuid.uuid4()}.pdf", content))

    # Create session
    session = AnalysisSession(
        user_id=current_user.id if current_user else None,
        job_description=job_description,
        job_title=job_title or None,
        status="pending",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Save files to disk under session directory
    session_dir = UPLOAD_DIR / session.id
    session_dir.mkdir(parents=True, exist_ok=True)

    for filename, content in buffered_files:
        dest = session_dir / filename
        dest.write_bytes(content)

    return UploadResponse(
        session_id=session.id,
        message="Files uploaded successfully.",
        file_count=len(files),
        session_access_token=create_session_access_token(session.id),
    )



