from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

# Schema base
class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    correo: Optional[EmailStr] = None
    rol: Optional[str] = Field(None, max_length=50)

# Schema para crear usuario
class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)

# Schema para login
class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str

# Schema para actualizar usuario
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    correo: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    rol: Optional[str] = Field(None, max_length=50)

# Schema para respuesta
class UsuarioResponse(UsuarioBase):
    id_usuario: UUID
    
    class Config:
        from_attributes = True