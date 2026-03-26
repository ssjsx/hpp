from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool

from middleware import register_exception_handlers
from model_controller import ensure_model_ready, router as model_router
from schemas import HealthResponse

_LOG_LEVEL = os.getenv("API_SERVER_LOG_LEVEL", "DEBUG").upper()
logging.basicConfig(
    level=getattr(logging, _LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await run_in_threadpool(ensure_model_ready)
    yield


app = FastAPI(title="Housing Model API", version="1.0.0", lifespan=lifespan)
register_exception_handlers(app)
app.include_router(model_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(success=0,status="ok")
