from decimal import Decimal

import pytest

from app.pricing import evaluate_price


def test_pricing_uses_decimal_and_rounds_money() -> None:
    assert evaluate_price(Decimal("100.05"), {"percentage": "7.5", "amount": "2.00"}) == Decimal("9.50")


def test_pricing_rejects_negative_adjustments() -> None:
    with pytest.raises(ValueError):
        evaluate_price(Decimal("100"), {"percentage": "-1"})
