from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Form

from prediction_service import estimate_property_value
from schemas import PropertyEstimateResponse, PropertyFeatures

router = APIRouter()


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
