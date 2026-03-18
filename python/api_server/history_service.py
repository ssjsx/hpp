from __future__ import annotations

import json
import logging
from typing import Any, cast

import pymysql

import config
from middleware import ApiError
from schemas import EstimateHistoryItem, PropertyFeatures

_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS app1_estimate_history (
    id VARCHAR(64) PRIMARY KEY,
    created_at BIGINT NOT NULL,
    prediction DOUBLE NOT NULL,
    inputs JSON NOT NULL,
    INDEX idx_app1_history_created_at (created_at)
)
"""

_CHECK_INDEX_SQL = """
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = 'app1_estimate_history'
    AND index_name = 'idx_app1_history_created_at'
    LIMIT 1
"""

_ADD_INDEX_SQL = """
    ALTER TABLE app1_estimate_history
    ADD INDEX idx_app1_history_created_at (created_at)
"""

_initialized = False
_logger = logging.getLogger(__name__)


def _parse_inputs_payload(raw_inputs: Any) -> dict[str, Any]:
    if isinstance(raw_inputs, dict):
        return raw_inputs

    if isinstance(raw_inputs, (bytes, bytearray)):
        raw_inputs = raw_inputs.decode("utf-8")

    if isinstance(raw_inputs, str):
        parsed = json.loads(raw_inputs)
        if isinstance(parsed, dict):
            return parsed

    raise ValueError("history inputs payload is not a valid JSON object")


def _connect() -> pymysql.connections.Connection:
    _logger.info(
        "Connecting to MySQL database: %s:%s@%s:%s/%s",
        config.MYSQL_USER,
        config.MYSQL_PASSWORD,
        config.MYSQL_HOST,
        config.MYSQL_PORT,
        config.MYSQL_DATABASE,
    )
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
                cursor.execute(_CHECK_INDEX_SQL)
                if cursor.fetchone() is None:
                    cursor.execute(_ADD_INDEX_SQL)
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
                rows = cast(list[dict[str, Any]], cursor.fetchall())
    except Exception as exc:
        raise ApiError(
            status_code=503,
            code="DB_READ_FAILED",
            message="Unable to load estimate history",
        ) from exc

    result: list[EstimateHistoryItem] = []
    for row in rows:
        try:
            parsed_inputs = _parse_inputs_payload(row.get("inputs"))
            result.append(
                EstimateHistoryItem(
                    id=str(row["id"]),
                    timestamp=int(row["created_at"]),
                    prediction=float(row["prediction"]),
                    inputs=PropertyFeatures.model_validate(parsed_inputs),
                )
            )
        except Exception as exc:
            _logger.warning(
                "Skipping invalid history row id=%s due to malformed inputs: %s",
                row.get("id"),
                exc,
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
