from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, Dict, Any
from uuid import UUID
from datetime import datetime


PAYMENT_STATUSES = {"pending", "approved", "rejected", "failed"}


class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Monto del pago")
    currency: str = Field(default="USD", min_length=1, max_length=10)
    id_reserva: Optional[UUID] = Field(default=None, description="Reserva asociada")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata opcional")


class PaymentResponse(BaseModel):
    id_payment: UUID
    amount: float
    currency: str
    status: str
    provider: str
    metadata: Optional[Dict[str, Any]]
    id_reserva: Optional[UUID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentStatusUpdate(BaseModel):
    payment_id: UUID
    status: Literal["pending", "approved", "rejected", "failed"]


class PaymentWebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: Optional[str] = None

    class Config:
        extra = "ignore"
