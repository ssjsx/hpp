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
    r2: float
    mae: float
    rmse: float


class ModelCoefficients(BaseModel):
    square_footage: float
    bedrooms: float
    bathrooms: float
    year_built: float
    lot_size: float
    distance_to_city_center: float
    school_rating: float


class ResponseBase(BaseModel):
    success: Literal[0, 1]


class SuccessResponseBase(ResponseBase):
    success: Literal[0] = 0


class PredictSingleResponse(SuccessResponseBase):
    prediction: float


class PredictBatchResponse(SuccessResponseBase):
    predictions: list[float]
    count: int


class ModelInfoResponse(SuccessResponseBase):
    model: str
    features: list[str]
    intercept: float
    coefficients: ModelCoefficients
    metrics: ModelMetrics
    model_weights_file: str


class HealthResponse(SuccessResponseBase):
    status: str


class ValidationErrorDetail(BaseModel):
    type: str
    loc: list[str | int]
    msg: str
    input: Any | None = None


class ErrorPayload(BaseModel):
    code: str
    message: str
    path: str
    details: list[ValidationErrorDetail] | None = None


class ErrorResponse(ResponseBase):
    success: Literal[1] = 1
    error: ErrorPayload
