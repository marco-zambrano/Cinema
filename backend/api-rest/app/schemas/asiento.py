from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class AsientoBase(BaseModel):
    numero: str = Field(..., min_length=1)
    estado: Optional[str] = Field(None, max_length=50)
    id_sala: Optional[UUID] = None

class AsientoCreate(AsientoBase):
    pass

class AsientoUpdate(BaseModel):
    numero: Optional[str] = Field(None, min_length=1)
    estado: Optional[str] = Field(None, max_length=50)
    id_sala: Optional[UUID] = None

class AsientoResponse(AsientoBase):
    id_asiento: UUID
    
    class Config:
        from_attributes = True