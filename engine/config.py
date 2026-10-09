from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


class ConfigurationError(RuntimeError):
    """Raised when required engine configuration is missing or invalid."""


ENGINE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ENGINE_DIR.parent


def _load_local_environment() -> None:
    load_dotenv(PROJECT_ROOT / ".env", override=False)
    load_dotenv(ENGINE_DIR / ".env", override=False)


def _positive_int(name: str, default: int) -> int:
    raw_value = os.getenv(name, str(default))
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be an integer") from exc
    if value <= 0:
        raise ConfigurationError(f"{name} must be greater than zero")
    return value


def _resolve_path(env_name: str, default: str) -> Path:
    configured = os.getenv(env_name, default)
    path = Path(configured)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path.resolve()


def _database_path() -> Path:
    return _resolve_path("MEDORCH_DB_PATH", "database/medorch.db")


def _audit_database_path() -> Path:
    return _resolve_path("AI_AUDIT_DB_PATH", "database/audit.db")


@dataclass(frozen=True)
class EngineConfig:
    api_key: str
    base_url: str
    model: str
    host: str
    port: int
    database_path: Path
    audit_database_path: Path
    query_timeout_seconds: int
    query_row_limit: int
    query_column_limit: int
    sql_max_length: int
    llm_timeout_seconds: float

    @classmethod
    def from_env(cls, *, require_api_key: bool = True) -> "EngineConfig":
        _load_local_environment()
        api_key = os.getenv("NVIDIA_API_KEY", "").strip()
        if require_api_key and not api_key:
            raise ConfigurationError(
                "NVIDIA_API_KEY is required for AI mode. Copy .env.example to .env "
                "and provide a newly issued key; do not reuse the exposed key."
            )

        database_path = _database_path()
        if not database_path.is_file():
            raise ConfigurationError(f"Database file was not found: {database_path}")

        return cls(
            api_key=api_key,
            base_url=os.getenv(
                "NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"
            ).strip(),
            model=os.getenv(
                "NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"
            ).strip(),
            host=os.getenv("ENGINE_HOST", "0.0.0.0").strip(),
            port=_positive_int("ENGINE_PORT", 50052),
            database_path=database_path,
            audit_database_path=_audit_database_path(),
            query_timeout_seconds=_positive_int("AI_QUERY_TIMEOUT_SECONDS", 5),
            query_row_limit=_positive_int("AI_QUERY_ROW_LIMIT", 200),
            query_column_limit=_positive_int("AI_QUERY_COLUMN_LIMIT", 12),
            sql_max_length=_positive_int("AI_SQL_MAX_LENGTH", 2000),
            llm_timeout_seconds=float(_positive_int("AI_LLM_TIMEOUT_SECONDS", 30)),
        )

