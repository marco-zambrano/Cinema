from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class PeliculaBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=255)
    genero: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    clasificacion: Optional[str] = Field(None, max_length=50)
    duracion: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=255)

class PeliculaCreate(PeliculaBase):
    pass

class PeliculaUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    genero: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    clasificacion: Optional[str] = Field(None, max_length=50)
    duracion: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=255)

class PeliculaResponse(PeliculaBase):
    id_pelicula: UUID
    
    class Config:
        from_attributes = True