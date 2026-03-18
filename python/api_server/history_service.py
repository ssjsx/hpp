from __future__ import annotations

from typing import Any

import pymysql

import config
from middleware import ApiError
from schemas import EstimateHistoryItem, PropertyFeatures

_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS app1_estimate_history (
    id VARCHAR(64) PRIMARY KEY,
    created_at BIGINT NOT NULL,
    prediction DOUBLE NOT NULL,
    inputs JSON NOT NULL
)
"""

_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_app1_history_created_at
ON app1_estimate_history (created_at DESC)
"""

_initialized = False


def _connect() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=config.MYSQL_HOST,
        port=config.MYSQL_PORT,
        user=config.MYSQL_USER,
        password=config.MYSQL_PASSWORD,
        database=config.MYSQL_DATABASE,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _ensure_initialized() -> None:
    global _initialized
    if _initialized:
        return

    try:
        with _connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(_TABLE_SQL)
                cursor.execute(_INDEX_SQL)
        _initialized = True
    except Exception as exc:  # pragma: no cover - defensive DB guard
        raise ApiError(
            status_code=503,
            code="DB_INIT_FAILED",
            message="Unable to initialize history database table",
        ) from exc


def list_history(limit: int = 100) -> list[EstimateHistoryItem]:
    _ensure_initialized()
    safe_limit = max(1, min(limit, 200))

    try:
        with _connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, created_at, prediction, inputs
                    FROM app1_estimate_history
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (safe_limit,),
                )
                rows: list[dict[str, Any]] = cursor.fetchall()
    except Exception as exc:
        raise ApiError(
            status_code=503,
            code="DB_READ_FAILED",
            message="Unable to load estimate history",
        ) from exc

    result: list[EstimateHistoryItem] = []
    for row in rows:
        result.append(
            EstimateHistoryItem(
                id=str(row["id"]),
                timestamp=int(row["created_at"]),
                prediction=float(row["prediction"]),
                inputs=PropertyFeatures.model_validate(row["inputs"]),
            )
        )
    return result


def upsert_history(entry: EstimateHistoryItem) -> None:
    _ensure_initialized()

    try:
        with _connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO app1_estimate_history (id, created_at, prediction, inputs)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        created_at = VALUES(created_at),
                        prediction = VALUES(prediction),
                        inputs = VALUES(inputs)
                    """,
                    (
                        entry.id,
                        entry.timestamp,
                        entry.prediction,
                        entry.inputs.model_dump_json(),
                    ),
                )
    except Exception as exc:
        raise ApiError(
            status_code=503,
            code="DB_WRITE_FAILED",
            message="Unable to save estimate history",
        ) from exc


def remove_history_item(item_id: str) -> None:
    _ensure_initialized()

    try:
        with _connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM app1_estimate_history WHERE id = %s",
                    (item_id,),
                )
    except Exception as exc:
        raise ApiError(
            status_code=503,
            code="DB_DELETE_FAILED",
            message="Unable to delete estimate history item",
        ) from exc


def clear_history() -> None:
    _ensure_initialized()

    try:
        with _connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM app1_estimate_history")
    except Exception as exc:
        raise ApiError(
            status_code=503,
            code="DB_DELETE_FAILED",
            message="Unable to clear estimate history",
        ) from exc
