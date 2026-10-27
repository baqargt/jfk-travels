from decimal import Decimal

from app.suppliers import FakeSupplier


def test_fake_supplier_search_is_reproducible() -> None:
    supplier = FakeSupplier()
    filters = {"origin": "KHI", "destination": "DXB", "adults": 2}
    first = supplier.search("flights", filters)
    second = supplier.search("flights", filters)
    assert [(row["id"], row["price"]) for row in first] == [(row["id"], row["price"]) for row in second]


def test_fake_supplier_lifecycle() -> None:
    supplier = FakeSupplier()
    offer = supplier.search("hotels", {"city": "Dubai"})[0]
    booking = supplier.book(offer, [{"firstName": "Test"}])
    assert supplier.retrieve(booking["supplier_reference"])["status"] == "confirmed"
    assert supplier.ticket(booking["supplier_reference"])["status"] == "ticketed"
    assert supplier.cancel(booking["supplier_reference"])["status"] == "cancelled"
    assert supplier.refund(booking["supplier_reference"], Decimal("10.00"))["status"] == "refunded"
