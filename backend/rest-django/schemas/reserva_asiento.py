from pydantic import BaseModel, UUID4, Field
from typing import Optional

class ReservaAsientoBase(BaseModel):
    id_reserva: UUID4
    id_asiento: UUID4

class ReservaAsientoCreate(ReservaAsientoBase):
    pass

class ReservaAsientoResponse(BaseModel):
    id_reserva: UUID4
    id_asiento: UUID4
    numero_asiento: Optional[str] = None
    estado_asiento: Optional[str] = None
    
    class Config:
        from_attributes = True
