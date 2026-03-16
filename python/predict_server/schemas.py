from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class HouseFeatures(BaseModel):
    square_footage: float = Field(..., gt=0)
    bedrooms: float = Field(..., ge=0)
    bathrooms: float = Field(..., ge=0)
    year_built: float = Field(..., ge=1700)
    lot_size: float = Field(..., gt=0)
    distance_to_city_center: float = Field(..., ge=0)
    school_rating: float = Field(..., ge=0, le=10)

    model_config = ConfigDict(extra="forbid")


class TrainingRow(HouseFeatures):
    price: float = Field(..., gt=0)


class ModelMetrics(BaseModel):
    r2: float = Field(...)
    mae: float = Field(...)
    rmse: float = Field(...)


class ModelCoefficients(BaseModel):
    square_footage: float = Field(...)
    bedrooms: float = Field(...)
    bathrooms: float = Field(...)
    year_built: float = Field(...)
    lot_size: float = Field(...)
    distance_to_city_center: float = Field(...)
    school_rating: float = Field(...)


class ResponseBase(BaseModel):
    success: Literal[0, 1] = Field(...)


class SuccessResponseBase(ResponseBase):
    success: Literal[0] = Field(0)


class PredictSingleResponse(SuccessResponseBase):
    prediction: float = Field(...)


class PredictBatchResponse(SuccessResponseBase):
    predictions: list[float] = Field(...)
    count: int = Field(...)


class ModelInfoResponse(SuccessResponseBase):
    model: str = Field(...)
    features: list[str] = Field(...)
    intercept: float = Field(...)
    coefficients: ModelCoefficients = Field(...)
    metrics: ModelMetrics = Field(...)
    model_weights_file: str = Field(...)


class HealthResponse(SuccessResponseBase):
    status: str = Field(...)


class ValidationErrorDetail(BaseModel):
    type: str = Field(...)
    loc: list[str | int] = Field(...)
    msg: str = Field(...)
    input: Any | None = Field(default=None)


class ErrorPayload(BaseModel):
    code: str = Field(...)
    message: str = Field(...)
    path: str = Field(...)
    details: list[ValidationErrorDetail] | None = Field(default=None)


class ErrorResponse(ResponseBase):
    success: Literal[1] = Field(1)
    error: ErrorPayload = Field(...)
