from __future__ import annotations

import os
from pathlib import Path

import yaml

_CONFIG_PATH = Path(__file__).parent / "config.yaml"

with _CONFIG_PATH.open() as _f:
    _raw = yaml.safe_load(_f)

_predict = _raw["predict_server"]

# --- predict_server integration ---
# Environment variables override values from config.yaml.
PREDICT_SERVER_URL: str = os.getenv("PREDICT_SERVER_URL", _predict["url"]).rstrip("/")
PREDICT_SERVER_TIMEOUT_SECONDS: float = float(
    os.getenv("PREDICT_SERVER_TIMEOUT_SECONDS", _predict["timeout_seconds"])
)

# --- CORS ---
_cors = _raw.get("cors", {})
_origins_env = os.getenv("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else list(_cors.get("allowed_origins", ["http://localhost:3000"]))
)
