from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool

from middleware import register_exception_handlers
from model_api import ensure_model_ready, router as model_router
from schemas import HealthResponse


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await run_in_threadpool(ensure_model_ready)
    yield


app = FastAPI(title="Housing Model API", version="1.0.0", lifespan=lifespan)
register_exception_handlers(app)
app.include_router(model_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
