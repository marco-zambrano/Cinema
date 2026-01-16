from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class FuncionBase(BaseModel):
    fecha_hora: datetime
    precio: Optional[Decimal] = Field(None, ge=0)
    id_pelicula: Optional[UUID] = None
    id_sala: Optional[UUID] = None

class FuncionCreate(FuncionBase):
    pass

class FuncionUpdate(BaseModel):
    fecha_hora: Optional[datetime] = None
    precio: Optional[Decimal] = Field(None, ge=0)
    id_pelicula: Optional[UUID] = None
    id_sala: Optional[UUID] = None

class FuncionResponse(FuncionBase):
    id_funcion: UUID
    
    class Config:
        from_attributes = True