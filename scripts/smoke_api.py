import os
import uuid

import httpx


base_url = os.getenv("SMOKE_BASE_URL", "http://localhost:8080/api/v1")
email = os.getenv("ADMIN_EMAIL", "admin@jfktravel.com")
password = os.getenv("ADMIN_PASSWORD", "change-me-now")

with httpx.Client(base_url=base_url, timeout=20) as client:
    login = client.post("/auth/login", json={"email": email, "password": password})
    login.raise_for_status()
    csrf = client.cookies["jfk_csrf"]
    headers = {"X-CSRF-Token": csrf}

    me = client.get("/auth/me")
    me.raise_for_status()
    accounts = client.get("/financial-accounts")
    accounts.raise_for_status()
    search = client.post(
        "/booking-searches/flights",
        json={"filters": {"origin": "KHI", "destination": "DXB", "adults": 1}},
    )
    search.raise_for_status()
    offer = search.json()["items"][0]
    quote = client.post(
        "/quotes",
        headers=headers,
        json={
            "serviceType": "flights",
            "offerId": offer["id"],
            "search": {"origin": "KHI", "destination": "DXB", "adults": 1},
        },
    )
    quote.raise_for_status()
    booking = client.post(
        f"/quotes/{quote.json()['id']}/confirm",
        headers={**headers, "Idempotency-Key": f"smoke-{uuid.uuid4()}"},
        json={
            "financialAccountId": accounts.json()[0]["id"],
            "passengers": [
                {
                    "passengerType": "adult",
                    "snapshot": {"firstName": "Smoke", "lastName": "Test"},
                }
            ],
        },
    )
    booking.raise_for_status()
    print({"user": me.json()["email"], "booking": booking.json()["reference"]})
