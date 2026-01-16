from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid

class UsuarioBase(BaseModel):
    correo: EmailStr
    nombre: str
    rol: Optional[str] = "cliente"

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id_usuario: uuid.UUID
    activo: bool
    fecha_creacion: datetime
    ultimo_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UsuarioResponse

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenValidate(BaseModel):
    """Esquema para validar tokens de forma interna"""
    token: str

class TokenData(BaseModel):
    """Datos extraídos del JWT"""
    id_usuario: Optional[uuid.UUID] = None
    correo: Optional[str] = None
    rol: Optional[str] = None
    tipo: Optional[str] = None  # 'access' o 'refresh'
    exp: Optional[int] = None
