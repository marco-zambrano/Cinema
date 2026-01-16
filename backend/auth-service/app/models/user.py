from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class Usuario(Base):
    """Modelo de Usuario para el servicio de autenticación"""
    __tablename__ = "usuario"
    
    id_usuario = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correo = Column(String(255), unique=True, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    password = Column(Text, nullable=False)
    rol = Column(String(50), default="cliente", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    ultimo_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Usuario(id={self.id_usuario}, correo={self.correo}, rol={self.rol})>"
