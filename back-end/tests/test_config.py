import pytest
from pydantic import ValidationError

from app.config import Settings


def test_seed_account_email_rejects_reserved_domain() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, admin_email="admin@jfk.local")
