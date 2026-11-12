"""Org KEY FLOW: access profiles drive permissions; user/customer links are enforced."""

from app.dependencies import permissions_for, role_names_for
from app.models import AccessProfile, Permission, User


def test_permissions_for_reads_access_profile() -> None:
    permission = Permission(key="user.manage", description="Manage users")
    profile = AccessProfile(
        name="Administrator",
        description="",
        preset_key="Administrator",
        permissions=[permission],
    )
    user = User(
        email="a@example.com",
        display_name="Admin",
        password_hash="x",
        access_profile=profile,
        roles=[],
    )
    assert permissions_for(user) == ["user.manage"]
    assert "Administrator" in role_names_for(user)


def test_require_roles_shim_uses_preset_key() -> None:
    profile = AccessProfile(
        name="HQ Admin",
        description="",
        preset_key="Administrator",
        permissions=[],
    )
    user = User(
        email="b@example.com",
        display_name="Admin",
        password_hash="x",
        access_profile=profile,
        roles=[],
    )
    assert role_names_for(user) == {"Administrator", "HQ Admin"}
