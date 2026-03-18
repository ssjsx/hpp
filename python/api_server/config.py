from __future__ import annotations

import os
from pathlib import Path

import yaml

_CONFIG_PATH = Path(__file__).parent / "config.yaml"
_DOTENV_PATH = Path(__file__).parent / ".env"


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        item = line.strip()
        if not item or item.startswith("#") or "=" not in item:
            continue
        key, value = item.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(_DOTENV_PATH)

with _CONFIG_PATH.open() as _f:
    _raw = yaml.safe_load(_f)

_predict = _raw["predict_server"]
_mysql = _raw.get("mysql", {})

# --- predict_server integration ---
# Environment variables override values from config.yaml.
PREDICT_SERVER_URL: str = os.getenv("PREDICT_SERVER_URL", _predict.get("url", "")).rstrip("/")
PREDICT_SERVER_TIMEOUT_SECONDS: float = float(
    os.getenv("PREDICT_SERVER_TIMEOUT_SECONDS", _predict["timeout_seconds"])
)

# --- CORS ---
_cors = _raw.get("cors", {})
_origins_env = os.getenv("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else list(_cors.get("allowed_origins", []))
)

# --- MySQL for app1 history ---
MYSQL_HOST: str = os.getenv("MYSQL_HOST", _mysql.get("host", ""))
MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", _mysql.get("port", 3306)))
MYSQL_USER: str = os.getenv("MYSQL_USER", _mysql.get("user", ""))
MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", _mysql.get("password", ""))
MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", _mysql.get("database", ""))
