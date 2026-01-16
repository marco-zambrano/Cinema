from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class ReservaBase(BaseModel):
    cantidad_asientos: Decimal = Field(..., ge=0)
    estado: Optional[str] = Field(None, max_length=50)
    id_funcion: Optional[UUID] = None
    id_usuario: Optional[UUID] = None
    total: Optional[Decimal] = Field(None, ge=0)
    fecha_reserva: datetime = None

class ReservaCreate(ReservaBase):
    pass

class ReservaUpdate(BaseModel):
    cantidad_asientos: Optional[Decimal] = Field(None, ge=0)
    estado: Optional[str] = Field(None, max_length=50)
    id_funcion: Optional[UUID] = None
    id_usuario: Optional[UUID] = None

class ReservaResponse(ReservaBase):
    id_reserva: UUID
    
    class Config:
        from_attributes = True