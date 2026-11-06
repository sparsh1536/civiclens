import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CivicLens API",
    version="0.1.0",
    description="Evidence-led political accountability and governance intelligence.",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CIVICLENS_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "civiclens-api", "version": "0.1.0"}


@app.get("/api/v1", tags=["system"])
async def api_root() -> dict[str, str]:
    return {
        "name": "CivicLens API",
        "status": "foundation",
        "message": "Research endpoints will be introduced in subsequent phases.",
    }
