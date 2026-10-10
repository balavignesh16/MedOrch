import pytest

from engine.model_profiles import ModelProfileConfigError, resolve_model_profiles


def _config(gemini_key: str | None):
    class _FakeConfig:
        gemini_api_key = gemini_key

    return _FakeConfig()


def test_resolves_all_three_profiles_from_the_shared_registry() -> None:
    profiles = resolve_model_profiles(_config(gemini_key=None))
    ids = {profile.id for profile in profiles}
    assert ids == {"qwen2.5-14b", "llama3.1-8b", "gemini-flash"}


def test_local_profiles_are_always_available() -> None:
    profiles = {p.id: p for p in resolve_model_profiles(_config(gemini_key=None))}
    assert profiles["qwen2.5-14b"].available is True
    assert profiles["llama3.1-8b"].available is True


def test_gemini_profile_unavailable_without_api_key() -> None:
    profiles = {p.id: p for p in resolve_model_profiles(_config(gemini_key=None))}
    assert profiles["gemini-flash"].available is False
    assert "GEMINI_API_KEY" in profiles["gemini-flash"].unavailable_reason


def test_gemini_profile_available_with_api_key() -> None:
    profiles = {p.id: p for p in resolve_model_profiles(_config(gemini_key="test-gemini-key"))}
    assert profiles["gemini-flash"].available is True
    assert profiles["gemini-flash"].api_key == "test-gemini-key"


def test_display_names_come_from_the_shared_registry_not_hardcoded_twice() -> None:
    profiles = {p.id: p for p in resolve_model_profiles(_config(gemini_key=None))}
    assert profiles["qwen2.5-14b"].display_name == "Qwen 2.5 14B (Local)"
    assert profiles["gemini-flash"].provider == "gemini"


def test_registry_operational_details_mismatch_fails_loudly(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    """Regression guard: if config/model_profiles.json ever declares an id
    with no matching operational-details entry in this module (or vice
    versa), that must fail loudly at resolve time rather than silently
    serving an incomplete or mismatched profile list."""
    import engine.model_profiles as model_profiles_module

    registry_file = tmp_path / "model_profiles.json"
    registry_file.write_text(
        '{"profiles": [{"id": "not-a-real-profile", "display_name": "Ghost", "provider": "ollama"}]}',
        encoding="utf-8",
    )
    monkeypatch.setattr(model_profiles_module, "PROFILES_REGISTRY_PATH", registry_file)

    with pytest.raises(ModelProfileConfigError):
        model_profiles_module.resolve_model_profiles(_config(gemini_key=None))
