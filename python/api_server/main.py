from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from prediction_controller import router as app1_router
from middleware import register_exception_handlers
from schemas import HealthResponse

app = FastAPI(title="Python Applications API", version="1.0.0")
register_exception_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(app1_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
