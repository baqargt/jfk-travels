from pathlib import Path

from app.config import Settings


def test_env_example_documents_every_setting() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env.example"
    documented = {
        line.split("=", 1)[0]
        for line in env_path.read_text(encoding="utf-8").splitlines()
        if line and not line.startswith("#") and "=" in line
    }
    expected = {name.upper() for name in Settings.model_fields}
    assert expected.issubset(documented), sorted(expected - documented)
