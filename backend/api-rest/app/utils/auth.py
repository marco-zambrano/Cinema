""" 
Módulo para validar tokens JWT localmente en el REST API
Recibe la SECRET_KEY del Auth Service para validar sin hacer llamadas HTTP
"""

from datetime import datetime
import json
from urllib import request as urllib_request
from urllib.error import URLError, HTTPError
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.AUTH_SERVICE_URL}/api/v1/auth/login")

class TokenData:
    """Datos extraídos de un JWT válido"""
    def __init__(self, id_usuario: str, correo: str, rol: str, exp: int):
        self.id_usuario = id_usuario
        self.correo = correo
        self.rol = rol
        self.exp = exp

def decode_token_locally(token: str) -> Optional[TokenData]:
    """
    Decodificar y validar un token JWT localmente
    
    Utiliza la SECRET_KEY del Auth Service para validar la firma
    sin hacer llamadas HTTP.
    
    Args:
        token: Token JWT
    
    Returns:
        TokenData si es válido, None si no lo es
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        id_usuario = payload.get("id_usuario")
        correo = payload.get("correo")
        rol = payload.get("rol")
        exp = payload.get("exp")
        token_type = payload.get("type")
        
        # Validar campos requeridos
        if not id_usuario or not correo:
            return None
        
        # Solo validar access tokens
        if token_type != "access":
            return None
        
        # Verificar expiración (exp puede venir como int/float o datetime)
        if exp:
            exp_ts: Optional[float] = None
            if isinstance(exp, (int, float)):
                exp_ts = float(exp)
            elif isinstance(exp, datetime):
                exp_ts = exp.timestamp()
            if exp_ts is not None and datetime.utcnow().timestamp() > exp_ts:
                return None
        
        return TokenData(
            id_usuario=id_usuario,
            correo=correo,
            rol=rol,
            exp=exp
        )
        
    except JWTError:
        return None
    except Exception as e:
        print(f"Error decodificando token: {str(e)}")
        return None

def _validate_token_via_auth_service(token: str) -> Optional[TokenData]:
    """Fallback: validar token en Auth Service si falla la validación local."""
    try:
        url = f"{settings.AUTH_SERVICE_URL}{settings.API_V1_PREFIX}/auth/validate"
        payload = json.dumps({"token": token}).encode("utf-8")
        req = urllib_request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib_request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
        data = json.loads(body)

        token_type = data.get("type") or data.get("tipo")
        if token_type != "access":
            return None

        id_usuario = data.get("id_usuario")
        correo = data.get("correo")
        rol = data.get("rol")
        exp = data.get("exp")

        if not id_usuario or not correo:
            return None

        return TokenData(id_usuario=str(id_usuario), correo=str(correo), rol=str(rol), exp=exp)
    except (HTTPError, URLError, TimeoutError, ValueError):
        return None
    except Exception as e:
        print(f"Error validando token en auth-service: {str(e)}")
        return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependency para extraer y validar el usuario actual del JWT
    
    Uso en endpoints protegidos:
        @router.get("/protected")
        def protected_endpoint(current_user: TokenData = Depends(get_current_user)):
            return {"usuario": current_user.correo}
    """
    token_data = decode_token_locally(token)
    if not token_data:
        token_data = _validate_token_via_auth_service(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return token_data

def get_current_admin(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """
    Dependency para validar que el usuario es administrador
    
    Uso:
        @router.delete("/admin/resource")
        def admin_endpoint(current_user: TokenData = Depends(get_current_admin)):
            ...
    """
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    
    return current_user
