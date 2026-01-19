import json
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models import Payment

PAYMENT_STATUSES = {"pending", "approved", "rejected", "failed"}


class PaymentProvider(ABC):
    @abstractmethod
    def create_payment(self, *, amount: float, currency: str = "USD", id_reserva: Optional[UUID] = None, metadata: Optional[Dict[str, Any]] = None) -> Payment:
        ...

    @abstractmethod
    def get_payment(self, payment_id: UUID) -> Payment:
        ...

    @abstractmethod
    def update_status(self, payment_id: UUID, new_status: str) -> Payment:
        ...


class MockAdapter(PaymentProvider):
    def __init__(self, db: Session):
        self.db = db

    def create_payment(self, *, amount: float, currency: str = "USD", id_reserva: Optional[UUID] = None, metadata: Optional[Dict[str, Any]] = None) -> Payment:
        payment = Payment(
            amount=amount,
            currency=currency,
            status="pending",
            provider="mock",
            id_reserva=id_reserva,
            meta_data=json.dumps(metadata or {}),
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_payment(self, payment_id: UUID) -> Payment:
        payment = self.db.query(Payment).filter(Payment.id_payment == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        return payment

    def update_status(self, payment_id: UUID, new_status: str) -> Payment:
        if new_status not in PAYMENT_STATUSES:
            raise ValueError("Invalid status")
        payment = self.get_payment(payment_id)
        payment.status = new_status
        payment.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(payment)
        return payment

    @staticmethod
    def normalize_payload(payment: Payment) -> Dict[str, Any]:
        metadata = json.loads(payment.meta_data) if payment.meta_data else None
        return {
            "payment_id": str(payment.id_payment),
            "status": payment.status,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "provider": payment.provider,
            "id_reserva": str(payment.id_reserva) if payment.id_reserva else None,
            "metadata": metadata,
        }
