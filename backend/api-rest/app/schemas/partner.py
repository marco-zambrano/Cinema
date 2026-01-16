from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class PartnerRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del partner")
    webhook_url: str = Field(..., min_length=1, max_length=500, description="URL del webhook")
    subscribed_events: Optional[List[str]] = Field(default=["order.created", "payment.completed"], description="Eventos suscritos")


class PartnerResponse(BaseModel):
    id_partner: UUID
    name: str
    webhook_url: str
    secret: str  # Solo se muestra al registrar
    subscribed_events: Optional[str]
    is_active: bool
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class WebhookPayload(BaseModel):
    event: str = Field(..., description="Tipo de evento: order.created, payment.completed, etc")
    data: dict = Field(..., description="Datos del evento")
    timestamp: Optional[str] = Field(default=None, description="Timestamp del evento")
