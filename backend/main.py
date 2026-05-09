from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database.db import init_db
from backend.routes import auth, upload, analyze, results, export
from backend.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="HireCopilot API",
    description="AI-powered resume screening and candidate ranking API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/auth",      tags=["Auth"])
app.include_router(upload.router,  prefix="/upload",    tags=["Upload"])
app.include_router(analyze.router, prefix="/analyze",   tags=["Analyze"])
app.include_router(results.router, prefix="/results",   tags=["Results"])
app.include_router(export.router,  prefix="/export",    tags=["Export"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}



