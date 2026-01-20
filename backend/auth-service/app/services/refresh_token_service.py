from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.token import RefreshToken
from datetime import datetime, timedelta
import uuid
from typing import Optional

def create_refresh_token(
    db: Session,
    id_usuario: uuid.UUID,
    token: str,
    expires_delta: timedelta
) -> RefreshToken:
    """Crear y almacenar refresh token en BD"""
    fecha_expiracion = datetime.utcnow() + expires_delta
    
    refresh_token = RefreshToken(
        id_usuario=id_usuario,
        token=token,
        fecha_expiracion=fecha_expiracion,
        activo=True
    )
    
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    
    return refresh_token

def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """Obtener refresh token de la BD"""
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()

def is_refresh_token_valid(db: Session, token: str) -> bool:
    """
    Verificar si un refresh token es válido
    
    Returns:
        True si es válido, False si no
    """
    refresh_token = get_refresh_token(db, token)
    
    if not refresh_token:
        return False
    
    if not refresh_token.activo:
        return False

    exp = refresh_token.fecha_expiracion
    now = datetime.utcnow()
    # Si exp viene con tzinfo (aware), comparar con now aware en el mismo tz
    if getattr(exp, "tzinfo", None) is not None:
        now = datetime.now(exp.tzinfo)

    if now > exp:
        return False
    
    return True

def invalidate_refresh_token(db: Session, token: str) -> None:
    """Invalidar un refresh token"""
    try:
        refresh_token = get_refresh_token(db, token)
        if refresh_token:
            refresh_token.activo = False
            db.commit()
    except Exception as e:
        print(f"Error invalidando refresh token: {str(e)}")
        db.rollback()

def invalidate_all_refresh_tokens(db: Session, id_usuario: uuid.UUID) -> None:
    """Invalidar todos los refresh tokens de un usuario"""
    try:
        tokens = db.query(RefreshToken).filter(
            and_(
                RefreshToken.id_usuario == id_usuario,
                RefreshToken.activo == True
            )
        ).all()
        
        for token in tokens:
            token.activo = False
        
        db.commit()
    except Exception as e:
        print(f"Error invalidando tokens: {str(e)}")
        db.rollback()

def cleanup_expired_tokens(db: Session) -> None:
    """Limpiar tokens expirados de la BD (mantenimiento)"""
    try:
        now = datetime.utcnow()
        
        # Eliminar refresh tokens expirados
        db.query(RefreshToken).filter(
            RefreshToken.fecha_expiracion < now
        ).delete()
        
        db.commit()
    except Exception as e:
        print(f"Error limpiando tokens expirados: {str(e)}")
        db.rollback()
