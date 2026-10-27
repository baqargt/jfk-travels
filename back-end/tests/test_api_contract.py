from fastapi.testclient import TestClient

from app.main import app


def test_liveness_and_security_headers() -> None:
    response = TestClient(app).get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_openapi_contains_public_contract() -> None:
    paths = app.openapi()["paths"]
    expected = {
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/company",
        "/api/v1/customers",
        "/api/v1/travellers",
        "/api/v1/approval-requests",
        "/api/v1/quotes",
        "/api/v1/financial-accounts",
        "/api/v1/files/upload-url",
    }
    assert expected.issubset(paths)


def test_validation_error_uses_problem_details() -> None:
    response = TestClient(app).post("/api/v1/auth/login", json={"email": "invalid"})
    body = response.json()
    assert response.status_code == 422
    assert body["title"] == "Validation failed"
    assert body["request_id"]
