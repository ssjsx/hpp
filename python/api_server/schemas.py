from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PropertyFeatures(BaseModel):
    square_footage: float = Field(
        ...,
        gt=0,
        title="Square Footage",
        description="Interior area of the property in square feet.",
        examples=[1550],
    )
    bedrooms: float = Field(
        ...,
        ge=0,
        title="Bedrooms",
        description="Number of bedrooms in the property.",
        examples=[3],
    )
    bathrooms: float = Field(
        ...,
        ge=0,
        title="Bathrooms",
        description="Number of bathrooms in the property.",
        examples=[2],
    )
    year_built: float = Field(
        ...,
        ge=1700,
        title="Year Built",
        description="Construction year of the property.",
        examples=[1997],
    )
    lot_size: float = Field(
        ...,
        gt=0,
        title="Lot Size",
        description="Total land size in square feet.",
        examples=[6800],
    )
    distance_to_city_center: float = Field(
        ...,
        ge=0,
        title="Distance To City Center",
        description="Distance from the property to city center in miles.",
        examples=[4.1],
    )
    school_rating: float = Field(
        ...,
        ge=0,
        le=10,
        title="School Rating",
        description="Nearby school quality score on a 0 to 10 scale.",
        examples=[7.6],
    )

    model_config = ConfigDict(extra="forbid")


class ResponseBase(BaseModel):
    success: Literal[0, 1] = Field(
        ...,
        title="Success Flag",
        description="0 means success, 1 means error.",
        examples=[0],
    )


class SuccessResponseBase(ResponseBase):
    success: Literal[0] = Field(
        default=0,
        title="Success Flag",
        description="Success response marker.",
    )


class PropertyEstimateResponse(SuccessResponseBase):
    prediction: float = Field(
        ...,
        title="Predicted Property Value",
        description="Estimated market value returned by regression model.",
        examples=[523450.12],
    )


class EstimateHistoryItem(BaseModel):
    id: str = Field(..., title="History Item ID", examples=["4f6144f2-8c53-4a1f-a2c0-11a6731b7f3d"])
    timestamp: int = Field(..., title="Unix Timestamp (ms)", examples=[1710662400000])
    inputs: PropertyFeatures = Field(..., title="Property Inputs")
    prediction: float = Field(..., title="Predicted Property Value", examples=[523450.12])


class HistoryListResponse(SuccessResponseBase):
    history: list[EstimateHistoryItem] = Field(default_factory=list)


class PredictServerSingleResponse(SuccessResponseBase):
    prediction: float = Field(
        ...,
        title="Predicted Property Value",
        description="Single prediction returned by predict_server.",
        examples=[523450.12],
    )


class ValidationErrorDetail(BaseModel):
    type: str = Field(..., title="Error Type", examples=["greater_than"])
    loc: list[str | int] = Field(
        ...,
        title="Error Location",
        description="Path to the invalid field in request payload.",
        examples=[["body", "square_footage"]],
    )
    msg: str = Field(..., title="Error Message", examples=["Input should be greater than 0"])
    input: Any | None = Field(
        default=None,
        title="Invalid Input",
        description="The actual invalid input value when available.",
    )


class ErrorPayload(BaseModel):
    code: str = Field(..., title="Error Code", examples=["VALIDATION_ERROR"])
    message: str = Field(..., title="Error Message", examples=["Request validation failed"])
    path: str = Field(..., title="Request Path", examples=["/app1/property-estimate"])
    details: list[ValidationErrorDetail] | None = Field(
        default=None,
        title="Error Details",
        description="Optional detailed validation errors.",
    )


class ErrorResponse(ResponseBase):
    success: Literal[1] = Field(
        default=1,
        title="Success Flag",
        description="Error response marker.",
    )
    error: ErrorPayload = Field(
        ...,
        title="Error Payload",
        description="Structured error response details.",
    )


class HealthResponse(SuccessResponseBase):
    status: str = Field(
        ...,
        title="Service Status",
        description="Current health status of the service.",
        examples=["ok"],
    )
