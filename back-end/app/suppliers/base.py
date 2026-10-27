from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any


class SupplierAdapter(ABC):
    @abstractmethod
    def search(self, service: str, filters: dict[str, Any]) -> list[dict]: ...

    @abstractmethod
    def reprice(self, service: str, offer_id: str, search: dict[str, Any]) -> dict: ...

    @abstractmethod
    def book(self, offer: dict, passengers: list[dict]) -> dict: ...

    @abstractmethod
    def retrieve(self, supplier_reference: str) -> dict: ...

    @abstractmethod
    def cancel(self, supplier_reference: str) -> dict: ...

    @abstractmethod
    def ticket(self, supplier_reference: str) -> dict: ...

    @abstractmethod
    def refund(self, supplier_reference: str, amount: Decimal) -> dict: ...
