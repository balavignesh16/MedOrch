"""Selectable LLM profiles for the frontend's model switcher.

Purely additive to the existing single-profile NVIDIA_*/Ollama config in
engine/config.py: if a request names no profile, the engine uses that
existing default client unchanged. These three named profiles are only
used when a request explicitly asks for one.

The list of valid ids and display names lives in
config/assistant_capabilities.json's sibling, config/model_profiles.json —
the same shared-JSON pattern used for analytics contexts — so the
frontend's allowlist can never silently desync from what the engine
actually accepts, the exact bug this project hit once already with a
hand-duplicated context list. Operational details (base_url, model, which
env var supplies the API key) stay in this Python module rather than the
JSON, since they are never needed by the frontend and the JSON is read by
code with no business holding that information. A startup check below
fails loudly if the two ever drift apart.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path

try:
    from .config import EngineConfig
except ImportError:
    from config import EngineConfig

ENGINE_DIR = Path(__file__).resolve().parent
PROFILES_REGISTRY_PATH = ENGINE_DIR.parent / "config" / "model_profiles.json"

OLLAMA_BASE_URL = "http://localhost:11434/v1"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


class ModelProfileConfigError(RuntimeError):
    """Raised when config/model_profiles.json and this module's operational
    details disagree about which profile ids exist."""


@dataclass(frozen=True)
class ModelProfile:
    id: str
    display_name: str
    provider: str  # "ollama" | "gemini"
    base_url: str
    model: str
    api_key: str
    available: bool
    unavailable_reason: str | None = None


def _load_registry_ids() -> dict[str, dict]:
    raw = json.loads(PROFILES_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {entry["id"]: entry for entry in raw["profiles"]}


def resolve_model_profiles(config: EngineConfig) -> list[ModelProfile]:
    """Build the fixed set of selectable profiles. Local (Ollama) profiles
    are always listed as available — we don't probe the Ollama server at
    startup, since it may be started after the engine; a genuinely
    unreachable Ollama surfaces per-request as PlannerConnectionError
    (MODEL_UNAVAILABLE), same as the existing default-profile behavior."""
    registry = _load_registry_ids()

    operational_details: dict[str, dict] = {
        "qwen2.5-14b": dict(
            base_url=OLLAMA_BASE_URL, model="qwen2.5:14b-instruct",
            api_key="ollama", available=True, unavailable_reason=None,
        ),
        "llama3.1-8b": dict(
            base_url=OLLAMA_BASE_URL, model="llama3.1:latest",
            api_key="ollama", available=True, unavailable_reason=None,
        ),
        "gemini-flash": dict(
            base_url=GEMINI_BASE_URL, model="gemini-flash-latest",
            api_key=config.gemini_api_key or "",
            available=config.gemini_api_key is not None,
            unavailable_reason=None if config.gemini_api_key else "GEMINI_API_KEY is not configured",
        ),
    }

    if registry.keys() != operational_details.keys():
        raise ModelProfileConfigError(
            "config/model_profiles.json and engine/model_profiles.py's operational "
            f"details disagree: registry has {sorted(registry.keys())}, "
            f"code has {sorted(operational_details.keys())}"
        )

    return [
        ModelProfile(
            id=profile_id,
            display_name=registry[profile_id]["display_name"],
            provider=registry[profile_id]["provider"],
            **operational_details[profile_id],
        )
        for profile_id in registry
    ]
