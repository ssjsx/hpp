from __future__ import annotations

import httpx

import config
from middleware import ApiError
from schemas import PredictServerSingleResponse, PropertyFeatures


async def estimate_property_value(payload: PropertyFeatures) -> float:
    url = f"{config.PREDICT_SERVER_URL}/predict"
    timeout = config.PREDICT_SERVER_TIMEOUT_SECONDS

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload.model_dump())
    except httpx.TimeoutException as exc:
        raise ApiError(
            status_code=504,
            code="PREDICT_SERVER_TIMEOUT",
            message="Predict server timeout",
        ) from exc
    except httpx.RequestError as exc:
        raise ApiError(
            status_code=503,
            code="PREDICT_SERVER_UNAVAILABLE",
            message="Cannot connect to predict server",
        ) from exc

    if response.status_code >= 500:
        raise ApiError(
            status_code=502,
            code="PREDICT_SERVER_ERROR",
            message="Predict server returned a server error",
        )

    if response.status_code >= 400:
        raise ApiError(
            status_code=400,
            code="PREDICT_REQUEST_REJECTED",
            message="Predict server rejected the request",
        )

    try:
        parsed = PredictServerSingleResponse.model_validate(response.json())
    except Exception as exc:
        raise ApiError(
            status_code=502,
            code="INVALID_PREDICT_RESPONSE",
            message="Predict server response format is invalid",
        ) from exc

    return parsed.prediction
