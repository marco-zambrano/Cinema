from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import json
from datetime import datetime

from app.database import get_db
from app.models import Partner
from app.schemas.partner import PartnerRegister, PartnerResponse

router = APIRouter(prefix="/partners", tags=["Partners"])


@router.post("/register", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
def register_partner(partner_data: PartnerRegister, db: Session = Depends(get_db)):
    """
    Registra un nuevo partner y genera un secret compartido para webhooks.
    
    El partner debe guardar este secret ya que se usa para firmar webhooks.
    """
    # Generar secret aleatorio
    secret = secrets.token_urlsafe(32)
    
    # Convertir lista de eventos a JSON string
    subscribed_events_json = json.dumps(partner_data.subscribed_events) if partner_data.subscribed_events else None
    
    # Crear partner
    new_partner = Partner(
        name=partner_data.name,
        webhook_url=partner_data.webhook_url,
        secret=secret,
        subscribed_events=subscribed_events_json,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)
    
    return new_partner


@router.get("/", response_model=List[PartnerResponse])
def list_partners(db: Session = Depends(get_db)):
    """
    Lista todos los partners registrados.
    """
    partners = db.query(Partner).filter(Partner.is_active == True).all()
    return partners


@router.get("/{partner_id}", response_model=PartnerResponse)
def get_partner(partner_id: str, db: Session = Depends(get_db)):
    """
    Obtiene información de un partner específico.
    """
    partner = db.query(Partner).filter(Partner.id_partner == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_partner(partner_id: str, db: Session = Depends(get_db)):
    """
    Desactiva un partner (soft delete).
    """
    partner = db.query(Partner).filter(Partner.id_partner == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    partner.is_active = False
    db.commit()
    return None
