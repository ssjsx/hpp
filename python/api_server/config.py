from __future__ import annotations

import os
from pathlib import Path

import yaml

_CONFIG_PATH = Path(__file__).parent / "config.yaml"

with _CONFIG_PATH.open() as _f:
    _raw = yaml.safe_load(_f)

_predict = _raw["predict_server"]
_mysql = _raw.get("mysql", {})

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

# --- MySQL for app1 history ---
MYSQL_HOST: str = os.getenv("MYSQL_HOST", _mysql.get("host", "127.0.0.1"))
MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", _mysql.get("port", 3306)))
MYSQL_USER: str = os.getenv("MYSQL_USER", _mysql.get("user", "root"))
MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", _mysql.get("password", ""))
MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", _mysql.get("database", "interview"))
