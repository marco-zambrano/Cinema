from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Usuario
from app.schemas.auth import TokenData

# OAuth2 scheme - Para validar tokens generados por el auth-service
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    """Obtiene el usuario actual desde el token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
        token_data = TokenData(correo=correo)
    except JWTError:
        raise credentials_exception
    
    usuario = db.query(Usuario).filter(Usuario.correo == token_data.correo).first()
    
    if usuario is None:
        raise credentials_exception
    
    return usuario

async def get_current_active_user(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Obtiene el usuario actual activo"""
    return current_user
