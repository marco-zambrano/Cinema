from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class RefreshToken(Base):
    """Modelo para almacenar refresh tokens"""
    __tablename__ = "refresh_token"
    
    id_token = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario"), nullable=False, index=True)
    token = Column(Text, unique=True, nullable=False, index=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False, index=True)
    activo = Column(bool, default=True, nullable=False)
    
    def __repr__(self):
        return f"<RefreshToken(id_usuario={self.id_usuario}, activo={self.activo})>"


class RevokedToken(Base):
    """Modelo para almacenar tokens revocados (blacklist)"""
    __tablename__ = "revoked_token"
    
    id_token_revocado = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(Text, unique=True, nullable=False, index=True)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario"), nullable=False, index=True)
    tipo_token = Column(String(50), nullable=False)  # 'access' o 'refresh'
    fecha_revocacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_expiracion_original = Column(DateTime, nullable=False)
    razon = Column(String(255), nullable=True)  # logout, password_change, etc
    
    def __repr__(self):
        return f"<RevokedToken(id_usuario={self.id_usuario}, tipo={self.tipo_token})>"
