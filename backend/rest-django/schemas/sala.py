from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from decimal import Decimal

class SalaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    capacidad: Optional[Decimal] = Field(None, ge=0)
    tipo: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50)
    filas: Optional[Decimal] = Field(None, ge=0)
    columnas: Optional[Decimal] = Field(None, ge=0)

class SalaCreate(SalaBase):
    pass

class SalaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    capacidad: Optional[Decimal] = Field(None, ge=0)
    tipo: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50)
    filas: Optional[int] = Field(None, ge=0)
    columnas: Optional[int] = Field(None, ge=0)

class SalaResponse(SalaBase):
    id_sala: UUID
    
    class Config:
        from_attributes = True