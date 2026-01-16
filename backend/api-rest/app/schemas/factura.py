from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class FacturaBase(BaseModel):
    fecha_emision: datetime
    total: Optional[Decimal] = Field(None, ge=0)
    metodo_pago: Optional[str] = Field(None, max_length=100)
    id_reserva: Optional[UUID] = None

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    fecha_emision: Optional[datetime] = None
    total: Optional[Decimal] = Field(None, ge=0)
    metodo_pago: Optional[str] = Field(None, max_length=100)
    id_reserva: Optional[UUID] = None

class FacturaResponse(FacturaBase):
    id_factura: UUID
    
    class Config:
        from_attributes = True