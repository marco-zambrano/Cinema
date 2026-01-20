from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
import json
from datetime import datetime
import httpx

from app.database import get_db
from app.models import Partner, WebhookLog
from app.schemas.partner import WebhookPayload
from app.utils.hmac_utils import verify_hmac_signature, generate_hmac_signature

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/receive")
async def receive_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_partner_name: Optional[str] = Header(None, alias="X-Partner-Name"),
    db: Session = Depends(get_db)
):
    """
    Endpoint para recibir webhooks de partners externos.
    
    Valida la firma HMAC y procesa el evento recibido.
    
    Headers requeridos:
    - X-Webhook-Signature: sha256=<hex> (firma HMAC del body)
    - X-Partner-Name: Nombre del partner (opcional, usa el primero si no se especifica)
    """
    # 1. Leer el body completo
    body = await request.body()
    body_str = body.decode('utf-8')
    
    # 2. Parsear JSON
    try:
        payload = json.loads(body_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # 3. Validar firma HMAC
    if not x_webhook_signature:
        raise HTTPException(status_code=401, detail="Missing X-Webhook-Signature header")
    
    # Identificar al partner (por nombre o usar el primero activo)
    if x_partner_name:
        partner = db.query(Partner).filter(
            Partner.name == x_partner_name,
            Partner.is_active == True
        ).first()
        if not partner:
            raise HTTPException(status_code=404, detail=f"Partner '{x_partner_name}' not found")
    else:
        partner = db.query(Partner).filter(Partner.is_active == True).first()
        if not partner:
            raise HTTPException(status_code=404, detail="No active partners found")
    
    # Verificar firma
    is_valid = verify_hmac_signature(body, x_webhook_signature, partner.secret)
    
    # DEBUG: Imprimir información para debuggear
    print(f"[DEBUG] Partner: {partner.name}")
    print(f"[DEBUG] Secret: {partner.secret}")
    print(f"[DEBUG] Body recibido: {body_str}")
    print(f"[DEBUG] Firma recibida: {x_webhook_signature}")
    print(f"[DEBUG] Firma esperada: {generate_hmac_signature(body, partner.secret)}")
    print(f"[DEBUG] ¿Es válida?: {is_valid}")
    
    if not is_valid:
        # Log intento fallido
        webhook_log = WebhookLog(
            id_partner=partner.id_partner,
            event_type=payload.get("event", "unknown"),
            payload=body_str,
            status_code=401,
            response="Invalid signature",
            created_at=datetime.utcnow()
        )
        db.add(webhook_log)
        db.commit()
        
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # 4. Procesar evento
    event_type = payload.get("event")
    event_data = payload.get("data", {})
    
    print(f"[WEBHOOK RECEIVED] Event: {event_type}")
    print(f"[WEBHOOK DATA] {event_data}")
    
    # Aquí puedes agregar lógica de negocio según el tipo de evento
    # Ejemplo:
    # if event_type == "order.created":
    #     # Crear factura, actualizar inventario, etc.
    #     pass
    # elif event_type == "payment.completed":
    #     # Actualizar estado de reserva
    #     pass
    
    # 5. Registrar webhook recibido
    webhook_log = WebhookLog(
        id_partner=partner.id_partner,
        event_type=event_type,
        payload=body_str,
        status_code=200,
        response="Processed successfully",
        created_at=datetime.utcnow()
    )
    db.add(webhook_log)
    db.commit()
    
    return {
        "status": "received",
        "event": event_type,
        "message": "Webhook processed successfully"
    }


@router.post("/send")
async def send_webhook_to_partners(
    webhook_data: WebhookPayload,
    db: Session = Depends(get_db)
):
    """
    Envía un webhook a todos los partners activos suscritos al evento.
    
    Esto es para ENVIAR notificaciones al otro equipo, no para recibirlas.
    """
    event_type = webhook_data.event
    
    # Obtener partners activos suscritos a este evento
    partners = db.query(Partner).filter(Partner.is_active == True).all()
    
    results = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for partner in partners:
            # Verificar si el partner está suscrito a este evento
            if partner.subscribed_events:
                try:
                    subscribed = json.loads(partner.subscribed_events)
                    if event_type not in subscribed:
                        continue
                except:
                    pass
            
            # Preparar payload: serializar de forma determinista (JSON compacto)
            payload = webhook_data.dict()
            payload_json = json.dumps(payload, separators=(",",":"))
            
            # Generar firma HMAC
            signature = generate_hmac_signature(payload_json, partner.secret)
            
            # Enviar webhook
            try:
                response = await client.post(
                    partner.webhook_url,
                    content=payload_json,  # Enviar exactamente los bytes firmados
                    headers={
                        "X-Webhook-Signature": signature,
                        # Identificador del partner emisor esperado por el sistema remoto
                        # Si existe remote_partner_id, se envía. En su defecto, usamos nuestro id local.
                        "X-Partner-Id": str(partner.remote_partner_id or partner.id_partner),
                        "Content-Type": "application/json"
                    }
                )
                
                # Log exitoso
                webhook_log = WebhookLog(
                    id_partner=partner.id_partner,
                    event_type=event_type,
                    payload=payload_json,
                    status_code=response.status_code,
                    response=response.text[:1000],  # Limitar tamaño
                    created_at=datetime.utcnow()
                )
                db.add(webhook_log)
                
                results.append({
                    "partner": partner.name,
                    "status": "success",
                    "status_code": response.status_code
                })
                
            except Exception as e:
                # Log error
                webhook_log = WebhookLog(
                    id_partner=partner.id_partner,
                    event_type=event_type,
                    payload=payload_json,
                    status_code=0,
                    response=str(e)[:1000],
                    created_at=datetime.utcnow()
                )
                db.add(webhook_log)
                
                results.append({
                    "partner": partner.name,
                    "status": "error",
                    "error": str(e)
                })
    
    db.commit()
    
    return {
        "event": event_type,
        "partners_notified": len(results),
        "results": results
    }
