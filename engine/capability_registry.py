"""Loader and schema verifier for the shared assistant capability registry.

The registry at ``config/assistant_capabilities.json`` is the single
cross-service source of truth for which analytics contexts exist and what
data they require. It is deliberately language-neutral JSON, not a Python
dictionary, so the frontend can read the same file without depending on
engine code.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import sqlite3

ENGINE_DIR = Path(__file__).resolve().parent
DEFAULT_REGISTRY_PATH = ENGINE_DIR.parent / "config" / "assistant_capabilities.json"


class RegistryError(RuntimeError):
    """Raised when the capability registry file is missing or malformed."""


@dataclass(frozen=True)
class CapabilityContext:
    id: str
    display_name: str
    description: str
    available: bool
    required_tables: tuple[str, ...]
    required_columns: tuple[str, ...]
    suggested_prompts: tuple[str, ...]
    unsupported_examples: tuple[str, ...]
    safety_limitations: tuple[str, ...]
    unavailable_reason: str | None = None

    def disable(self, reason: str) -> "CapabilityContext":
        return CapabilityContext(
            id=self.id,
            display_name=self.display_name,
            description=self.description,
            available=False,
            required_tables=self.required_tables,
            required_columns=self.required_columns,
            suggested_prompts=self.suggested_prompts,
            unsupported_examples=self.unsupported_examples,
            safety_limitations=self.safety_limitations,
            unavailable_reason=reason,
        )


def load_registry(path: Path | None = None) -> list[CapabilityContext]:
    registry_path = path or DEFAULT_REGISTRY_PATH
    if not registry_path.is_file():
        raise RegistryError(f"Capability registry not found: {registry_path}")

    try:
        raw = json.loads(registry_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise RegistryError(f"Capability registry is not valid JSON: {exc}") from exc

    contexts_raw = raw.get("contexts")
    if not isinstance(contexts_raw, list) or not contexts_raw:
        raise RegistryError("Capability registry must declare a non-empty 'contexts' list")

    contexts: list[CapabilityContext] = []
    seen_ids: set[str] = set()
    for entry in contexts_raw:
        try:
            context_id = str(entry["id"])
        except KeyError as exc:
            raise RegistryError(f"Capability context missing required field: {exc}") from exc
        if context_id in seen_ids:
            raise RegistryError(f"Duplicate capability context id: {context_id}")
        seen_ids.add(context_id)
        try:
            contexts.append(
                CapabilityContext(
                    id=context_id,
                    display_name=str(entry["display_name"]),
                    description=str(entry["description"]),
                    available=bool(entry["available"]),
                    required_tables=tuple(entry.get("required_tables", [])),
                    required_columns=tuple(entry.get("required_columns", [])),
                    suggested_prompts=tuple(entry.get("suggested_prompts", [])),
                    unsupported_examples=tuple(entry.get("unsupported_examples", [])),
                    safety_limitations=tuple(entry.get("safety_limitations", [])),
                    unavailable_reason=entry.get("unavailable_reason"),
                )
            )
        except KeyError as exc:
            raise RegistryError(
                f"Capability context '{context_id}' missing required field: {exc}"
            ) from exc
    return contexts


def _actual_schema(database_path: Path) -> dict[str, set[str]]:
    schema: dict[str, set[str]] = {}
    uri = f"{database_path.as_uri()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        tables = [
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        ]
        for table in tables:
            schema[table] = {
                row[1] for row in connection.execute(f"PRAGMA table_info('{table}')").fetchall()
            }
    return schema


def resolve_against_schema(
    contexts: list[CapabilityContext], database_path: Path
) -> list[CapabilityContext]:
    """Disable any context whose declared tables/columns do not exist.

    Contexts already marked unavailable in the registry are left unchanged.
    Returns a new list; never mutates the input.
    """
    schema = _actual_schema(database_path)
    resolved: list[CapabilityContext] = []
    for context in contexts:
        if not context.available:
            resolved.append(context)
            continue

        missing_tables = [t for t in context.required_tables if t not in schema]
        if missing_tables:
            resolved.append(
                context.disable(f"Missing required table(s): {', '.join(sorted(missing_tables))}")
            )
            continue

        available_columns: set[str] = set()
        for table in context.required_tables:
            available_columns |= schema.get(table, set())
        missing_columns = sorted(
            column for column in context.required_columns if column not in available_columns
        )
        if missing_columns:
            resolved.append(
                context.disable(f"Missing required column(s): {', '.join(missing_columns)}")
            )
            continue

        resolved.append(context)
    return resolved
