"""Super admin roles and company quota enforcement."""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.dependencies import permissions_for, role_names_for
from app.errors import ApiError
from app.main import app
from app.models import Company, User
from app.services import assert_company_quota, company_payload


def test_super_admin_role_and_permissions() -> None:
    user = User(
        email="super@example.com",
        display_name="Super",
        password_hash="x",
        is_super_admin=True,
        roles=[],
    )
    assert role_names_for(user) == {"SuperAdmin"}
    assert permissions_for(user) == []


def test_assert_company_quota_allows_under_limit() -> None:
    company_id = uuid.uuid4()
    company = Company(
        legal_name="Acme",
        trading_name="Acme",
        email="ops@acme.example",
        max_sub_companies=5,
        max_users=10,
        max_travellers=100,
    )
    company.id = company_id
    db = MagicMock()
    db.get.return_value = company
    with patch(
        "app.services.company_usage",
        return_value={"sub_companies": 1, "users": 2, "travellers": 3},
    ):
        assert_company_quota(db, company_id, "users")
        assert_company_quota(db, company_id, "sub_companies")
        assert_company_quota(db, company_id, "travellers")


def test_assert_company_quota_blocks_at_limit() -> None:
    company_id = uuid.uuid4()
    company = Company(
        legal_name="Acme",
        trading_name="Acme",
        email="ops@acme.example",
        max_sub_companies=1,
        max_users=2,
        max_travellers=3,
    )
    company.id = company_id
    db = MagicMock()
    db.get.return_value = company
    with patch(
        "app.services.company_usage",
        return_value={"sub_companies": 1, "users": 2, "travellers": 3},
    ):
        with pytest.raises(ApiError) as users_exc:
            assert_company_quota(db, company_id, "users")
        assert users_exc.value.status == 409
        assert "users" in users_exc.value.detail

        with pytest.raises(ApiError) as branches_exc:
            assert_company_quota(db, company_id, "sub_companies")
        assert branches_exc.value.status == 409
        assert "sub-companies" in branches_exc.value.detail

        with pytest.raises(ApiError) as travellers_exc:
            assert_company_quota(db, company_id, "travellers")
        assert travellers_exc.value.status == 409
        assert "traveller profiles" in travellers_exc.value.detail


def test_company_payload_includes_quotas_and_usage() -> None:
    company = Company(
        legal_name="Acme Travel LLC",
        trading_name="Acme Travel",
        email="ops@acme.example",
        max_sub_companies=4,
        max_users=20,
        max_travellers=200,
    )
    company.id = uuid.uuid4()
    db = MagicMock()
    with patch(
        "app.services.company_usage",
        return_value={"sub_companies": 1, "users": 5, "travellers": 9},
    ):
        payload = company_payload(company, db)
    assert payload["tradingName"] == "Acme Travel"
    assert payload["legalName"] == "Acme Travel LLC"
    assert payload["maxSubCompanies"] == 4
    assert payload["maxUsers"] == 20
    assert payload["maxTravellers"] == 200
    assert payload["usage"] == {"subCompanies": 1, "users": 5, "travellers": 9}


def test_platform_dashboard_endpoints_require_auth() -> None:
    client = TestClient(app)
    company_id = uuid.uuid4()
    paths = [
        f"/api/v1/platform/companies/{company_id}/dashboard/summary",
        f"/api/v1/platform/companies/{company_id}/financial-accounts",
        f"/api/v1/platform/companies/{company_id}/reports/dsr",
    ]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 401, path
