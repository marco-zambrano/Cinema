from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import json

from app.database import get_db
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentStatusUpdate
from app.schemas.partner import WebhookPayload
from app.services.payment_service import MockAdapter, PAYMENT_STATUSES
from app.routes.webhooks import send_webhook_to_partners

router = APIRouter(prefix="/payments", tags=["Payments"])


STATUS_EVENT_MAP = {
    "approved": "payment.completed",
    "rejected": "payment.failed",
    "failed": "payment.failed",
    "pending": "payment.pending",
}


def payment_to_response(payment) -> PaymentResponse:
    metadata = json.loads(payment.meta_data) if payment.meta_data else None
    return PaymentResponse(
        id_payment=payment.id_payment,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status,
        provider=payment.provider,
        metadata=metadata,
        id_reserva=payment.id_reserva,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )


@router.post("/", response_model=PaymentResponse)
async def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    adapter = MockAdapter(db)
    payment = adapter.create_payment(
        amount=payload.amount,
        currency=payload.currency,
        id_reserva=payload.id_reserva,
        metadata=payload.metadata,
    )
    return payment_to_response(payment)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: UUID, db: Session = Depends(get_db)):
    adapter = MockAdapter(db)
    try:
        payment = adapter.get_payment(payment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment_to_response(payment)


@router.post("/mock/webhook")
async def simulate_payment_webhook(payload: PaymentStatusUpdate, db: Session = Depends(get_db)):
    adapter = MockAdapter(db)
    if payload.status not in PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        payment = adapter.update_status(payload.payment_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    normalized = MockAdapter.normalize_payload(payment)
    event_type = STATUS_EVENT_MAP.get(payment.status, "payment.updated")
    webhook_payload = WebhookPayload(event=event_type, data=normalized)

    # Reutilizamos el envío de webhooks con firma HMAC a los partners
    webhook_result = await send_webhook_to_partners(webhook_payload, db)

    return {
        "payment": payment_to_response(payment),
        "webhook": webhook_result,
    }
