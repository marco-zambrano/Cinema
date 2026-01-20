from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import json

from app.database import get_db
from app.models import Partner
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentStatusUpdate
from app.schemas.partner import WebhookPayload
from app.services.payment_service import MockAdapter, PAYMENT_STATUSES
from app.routes.webhooks import send_webhook_to_partners
from app.utils.hmac_utils import generate_hmac_signature

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


@router.post("/debug/webhook-payload")
async def debug_webhook_payload(payload: PaymentStatusUpdate, db: Session = Depends(get_db)):
    """
    Endpoint de DEBUG: muestra exactamente qué payload y firma se está enviando.
    """
    adapter = MockAdapter(db)
    try:
        payment = adapter.get_payment(payload.payment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Payment not found")

    normalized = MockAdapter.normalize_payload(payment)
    event_type = STATUS_EVENT_MAP.get(payload.status, "payment.updated")
    webhook_payload = WebhookPayload(event=event_type, data=normalized)

    # Serializar exactamente como se envía
    payload_dict = webhook_payload.dict()
    payload_json = json.dumps(payload_dict, separators=(",", ":"))
    
    # Obtener partner para firmar con su secret
    partner = db.query(Partner).filter_by(name='Servicio tecnico').first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner 'Servicio tecnico' not found")
    
    signature = generate_hmac_signature(payload_json, partner.secret)
    
    return {
        "debug_info": {
            "payload_json": payload_json,
            "payload_bytes": payload_json.encode('utf-8').hex(),
            "signature": signature,
            "partner_secret": partner.secret,
            "partner_remote_id": partner.remote_partner_id,
            "message": "Copia el payload_json y pruébalo en Postman con este secret"
        }
    }


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

    webhook_result = await send_webhook_to_partners(webhook_payload, db)

    return {
        "payment": payment_to_response(payment),
        "webhook": webhook_result,
    }


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: UUID, db: Session = Depends(get_db)):
    adapter = MockAdapter(db)
    try:
        payment = adapter.get_payment(payment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment_to_response(payment)
