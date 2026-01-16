from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Usuario
from app.schemas.auth import TokenData
from app.models.token import RevokedToken
import uuid

# Configuración de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Generar hash de contraseña"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña contra hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_token(
    data: dict,
    token_type: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crear un token JWT
    
    Args:
        data: Datos para incluir en el token
        token_type: 'access' o 'refresh'
        expires_delta: Duración personalizada (opcional)
    
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        if token_type == "access":
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        elif token_type == "refresh":
            expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        else:
            expire = datetime.utcnow() + timedelta(hours=1)
    
    to_encode.update({"exp": expire, "type": token_type})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenData]:
    """
    Decodificar un token JWT
    
    Args:
        token: Token JWT
    
    Returns:
        TokenData si es válido, None si no
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        id_usuario: str = payload.get("id_usuario")
        correo: str = payload.get("correo")
        rol: str = payload.get("rol")
        token_type: str = payload.get("type")
        exp: int = payload.get("exp")
        
        if id_usuario is None:
            return None
        
        return TokenData(
            id_usuario=uuid.UUID(id_usuario),
            correo=correo,
            rol=rol,
            tipo=token_type,
            exp=exp
        )
    except JWTError:
        return None
    except Exception:
        return None

def is_token_revoked(token: str, db: Session) -> bool:
    """
    Verificar si un token está en la blacklist
    
    Args:
        token: Token JWT
        db: Sesión de BD
    
    Returns:
        True si está revocado, False si no
    """
    try:
        revoked = db.query(RevokedToken).filter(
            RevokedToken.token == token
        ).first()
        return revoked is not None
    except Exception:
        return False

def revoke_token(
    token: str,
    id_usuario: uuid.UUID,
    token_type: str,
    razon: str,
    exp: int,
    db: Session
) -> None:
    """
    Revocar un token (agregarlo a la blacklist)
    
    Args:
        token: Token JWT
        id_usuario: ID del usuario
        token_type: 'access' o 'refresh'
        razon: Razón de revocación
        exp: Timestamp de expiración original
        db: Sesión de BD
    """
    try:
        fecha_expiracion = datetime.fromtimestamp(exp)
        revoked_token = RevokedToken(
            token=token,
            id_usuario=id_usuario,
            tipo_token=token_type,
            razon=razon,
            fecha_expiracion_original=fecha_expiracion
        )
        db.add(revoked_token)
        db.commit()
    except Exception as e:
        print(f"Error revocando token: {str(e)}")
        db.rollback()

def authenticate_user(db: Session, correo: str, password: str) -> Optional[Usuario]:
    """
    Autenticar usuario
    
    Args:
        db: Sesión de BD
        correo: Correo del usuario
        password: Contraseña
    
    Returns:
        Usuario si es válido, None si no
    """
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    if not usuario:
        return None
    if not verify_password(password, usuario.password):
        return None
    if not usuario.activo:
        return None
    return usuario

def create_access_token(id_usuario: str, correo: str, rol: str) -> str:
    """Crear token de acceso"""
    data = {
        "id_usuario": id_usuario,
        "correo": correo,
        "rol": rol
    }
    return create_token(data, "access")

def create_refresh_token(id_usuario: str, correo: str, rol: str) -> str:
    """Crear token de renovación"""
    data = {
        "id_usuario": id_usuario,
        "correo": correo,
        "rol": rol
    }
    return create_token(data, "refresh")
