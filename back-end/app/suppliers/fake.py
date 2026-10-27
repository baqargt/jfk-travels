import hashlib
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from app.suppliers.base import SupplierAdapter


class FakeSupplier(SupplierAdapter):
    def _seed(self, service: str, filters: dict[str, Any]) -> int:
        canonical = json.dumps({"service": service, "filters": filters}, sort_keys=True, default=str)
        return int(hashlib.sha256(canonical.encode()).hexdigest()[:12], 16)

    def search(self, service: str, filters: dict[str, Any]) -> list[dict]:
        seed = self._seed(service, filters)
        labels = {
            "flights": "JFK Airways",
            "hotels": "JFK Select Hotel",
            "insurance": "JFK Travel Cover",
            "transfers": "JFK Private Transfer",
            "holidays": "JFK Holiday Package",
            "sightseeing": "JFK City Experience",
            "fix-departure": "JFK Fixed Departure",
            "a-to-a": "JFK A-to-A Service",
        }
        now = datetime.now(UTC)
        offers = []
        for index in range(5):
            price = Decimal(80 + ((seed >> (index * 5)) % 920)) + Decimal(index * 17)
            offer_id = f"FAKE-{service.upper()}-{hashlib.sha1(f'{seed}:{index}'.encode()).hexdigest()[:12]}"
            offers.append(
                {
                    "id": offer_id,
                    "title": f"{labels.get(service, 'JFK Service')} {index + 1}",
                    "subtitle": "Deterministic development inventory",
                    "currency": "USD",
                    "price": price.quantize(Decimal("0.01")),
                    "expires_at": now + timedelta(minutes=20),
                    "details": {
                        "service": service,
                        "rank": index + 1,
                        "filters": filters,
                        "provider": "fake",
                    },
                }
            )
        return offers

    def reprice(self, service: str, offer_id: str, search: dict[str, Any]) -> dict:
        offers = self.search(service, search)
        for offer in offers:
            if offer["id"] == offer_id:
                return offer
        raise ValueError("Offer is no longer available")

    def book(self, offer: dict, passengers: list[dict]) -> dict:
        digest = hashlib.sha1(f"{offer['id']}:{len(passengers)}".encode()).hexdigest()[:8].upper()
        return {"supplier_reference": f"FAKE-{digest}", "status": "confirmed"}

    def retrieve(self, supplier_reference: str) -> dict:
        return {"supplier_reference": supplier_reference, "status": "confirmed"}

    def cancel(self, supplier_reference: str) -> dict:
        return {"supplier_reference": supplier_reference, "status": "cancelled"}

    def ticket(self, supplier_reference: str) -> dict:
        return {
            "supplier_reference": supplier_reference,
            "status": "ticketed",
            "ticket": f"TKT-{supplier_reference}",
        }

    def refund(self, supplier_reference: str, amount: Decimal) -> dict:
        return {"supplier_reference": supplier_reference, "status": "refunded", "amount": str(amount)}
