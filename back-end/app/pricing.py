from decimal import ROUND_HALF_UP, Decimal

MONEY = Decimal("0.01")


def evaluate_price(base_amount: Decimal, rules: dict) -> Decimal:
    """Return a deterministic markup using decimal arithmetic only."""
    if base_amount < 0:
        raise ValueError("Base amount cannot be negative")
    percentage = Decimal(str(rules.get("percentage", "0")))
    fixed = Decimal(str(rules.get("amount", "0")))
    if percentage < 0 or fixed < 0:
        raise ValueError("Pricing adjustments cannot be negative")
    return (base_amount * percentage / Decimal("100") + fixed).quantize(MONEY, rounding=ROUND_HALF_UP)
