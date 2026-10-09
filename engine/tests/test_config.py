import pytest

from engine import config


def test_missing_api_key_fails_clearly(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "_load_local_environment", lambda: None)
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)

    with pytest.raises(config.ConfigurationError, match="NVIDIA_API_KEY is required"):
        config.EngineConfig.from_env()


def test_configuration_accepts_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "_load_local_environment", lambda: None)
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    monkeypatch.setenv("MEDORCH_DB_PATH", str(config.PROJECT_ROOT / "database/medorch.db"))
    monkeypatch.setenv("ENGINE_PORT", "50100")

    loaded = config.EngineConfig.from_env()

    assert loaded.api_key == "test-key"
    assert loaded.port == 50100
    assert loaded.database_path.name == "medorch.db"


def test_non_positive_port_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "_load_local_environment", lambda: None)
    monkeypatch.setenv("NVIDIA_API_KEY", "test-key")
    monkeypatch.setenv("MEDORCH_DB_PATH", str(config.PROJECT_ROOT / "database/medorch.db"))
    monkeypatch.setenv("ENGINE_PORT", "0")

    with pytest.raises(config.ConfigurationError, match="greater than zero"):
        config.EngineConfig.from_env()
