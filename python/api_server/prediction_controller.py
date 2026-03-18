from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Form

from history_service import clear_history, list_history, remove_history_item, upsert_history
from prediction_service import estimate_property_value
from schemas import (
    EstimateHistoryItem,
    HistoryListResponse,
    PropertyEstimateResponse,
    PropertyFeatures,
    SuccessResponseBase,
)

router = APIRouter(prefix="/app1")


@router.post("/property-estimate", response_model=PropertyEstimateResponse)
async def property_estimate_from_form(
    square_footage: Annotated[float, Form(...)],
    bedrooms: Annotated[float, Form(...)],
    bathrooms: Annotated[float, Form(...)],
    year_built: Annotated[float, Form(...)],
    lot_size: Annotated[float, Form(...)],
    distance_to_city_center: Annotated[float, Form(...)],
    school_rating: Annotated[float, Form(...)],
) -> PropertyEstimateResponse:
    features = PropertyFeatures(
        square_footage=square_footage,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        year_built=year_built,
        lot_size=lot_size,
        distance_to_city_center=distance_to_city_center,
        school_rating=school_rating,
    )
    prediction = await estimate_property_value(features)
    return PropertyEstimateResponse(prediction=prediction)


@router.get("/history", response_model=HistoryListResponse)
async def get_history() -> HistoryListResponse:
    return HistoryListResponse(history=list_history(limit=100))


@router.post("/history", response_model=SuccessResponseBase)
async def save_history(entry: EstimateHistoryItem) -> SuccessResponseBase:
    upsert_history(entry)
    return SuccessResponseBase()


@router.delete("/history", response_model=SuccessResponseBase)
async def delete_history(id: str | None = None) -> SuccessResponseBase:
    if id:
        remove_history_item(id)
    else:
        clear_history()
    return SuccessResponseBase()
