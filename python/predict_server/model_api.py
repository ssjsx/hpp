from __future__ import annotations

from typing import TypeAlias

from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from house_model import HouseModel
from middleware import ApiError
from schemas import (
    HouseFeatures,
    ModelInfoResponse,
    PredictBatchResponse,
    PredictSingleResponse,
)


house_model = HouseModel()
router = APIRouter()


def ensure_model_ready() -> None:
    house_model.ensure_loaded()


PredictResponse: TypeAlias = PredictSingleResponse | PredictBatchResponse


@router.post("/predict", response_model=PredictResponse)
async def predict(payload: HouseFeatures | list[HouseFeatures]) -> PredictResponse:
    if isinstance(payload, list):
        if not payload:
            raise ApiError(
                status_code=400,
                code="EMPTY_BATCH",
                message="Batch payload cannot be empty",
            )

        predictions = await run_in_threadpool(house_model.predict_batch, payload)
        return PredictBatchResponse(predictions=predictions, count=len(payload))

    prediction = await run_in_threadpool(house_model.predict_one, payload)
    return PredictSingleResponse(prediction=prediction)


@router.get("/model-info", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    return await run_in_threadpool(house_model.model_info)
