from datetime import datetime, timedelta

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from backend.database.db import get_db
from backend.models.db_models import User
from backend.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
SESSION_ACCESS_SCOPE = "session-access"


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns the current user if a valid token is provided, else None (guest)."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None
    return db.query(User).filter(User.id == user_id).first()


def require_user(current_user: User | None = Depends(get_current_user)) -> User:
    """Use this dependency when authentication is mandatory."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def create_session_access_token(session_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": session_id, "scope": SESSION_ACCESS_SCOPE, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def get_session_access_token(
    session_access_header: str | None = Header(default=None, alias="X-Session-Access"),
    session_access_query: str | None = Query(default=None, alias="session_access_token"),
) -> str | None:
    return session_access_header or session_access_query


def has_session_access(session_id: str, session_access_token: str | None) -> bool:
    if not session_access_token:
        return False
    try:
        payload = jwt.decode(
            session_access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        return False
    return (
        payload.get("scope") == SESSION_ACCESS_SCOPE
        and payload.get("sub") == session_id
    )



