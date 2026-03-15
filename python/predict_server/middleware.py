from __future__ import annotations

import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from schemas import ErrorPayload, ErrorResponse, ValidationErrorDetail


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def error_response(
    status_code: int,
    code: str,
    message: str,
    path: str,
    details: list[ValidationErrorDetail] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorPayload(code=code, message=message, path=path, details=details)
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump(exclude_none=True))


def register_exception_handlers(app: FastAPI) -> None:
    @app.middleware("http")
    async def unified_error_middleware(request: Request, call_next):
        try:
            return await call_next(request)
        except ApiError as exc:
            return error_response(exc.status_code, exc.code, exc.message, request.url.path)
        except Exception:
            # Keep traceback in logs for debugging while returning a safe response body.
            traceback.print_exc()
            return error_response(
                500,
                "INTERNAL_SERVER_ERROR",
                "Internal server error",
                request.url.path,
            )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return error_response(exc.status_code, "HTTP_ERROR", str(exc.detail), request.url.path)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = [
            ValidationErrorDetail(
                type=str(item.get("type", "validation_error")),
                loc=list(item.get("loc", [])),
                msg=str(item.get("msg", "Request validation failed")),
                input=item.get("input"),
            )
            for item in exc.errors()
        ]
        return error_response(
            422,
            "VALIDATION_ERROR",
            "Request validation failed",
            request.url.path,
            details=details,
        )
