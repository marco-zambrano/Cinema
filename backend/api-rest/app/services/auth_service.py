from datetime import datetime, timedelta
from typing import Optional
import hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Usuario
from app.schemas.auth import TokenData

# Configuración de encriptación
# Usar Argon2 - más seguro que bcrypt, sin límite de longitud de contraseña
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

def get_password_hash(password: str) -> str:
    """
    Generate a password hash using Argon2.
    Argon2 is more secure than bcrypt and has no password length limits.
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password must be a non-empty string")
    
    try:
        return pwd_context.hash(password)
        
    except Exception as e:
        print(f"Error hashing password: {str(e)}")
        raise ValueError(f"Error al hashear la contraseña: {str(e)}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a stored password using Argon2.
    Argon2 is more secure than bcrypt and has no password length limits.
    """
    try:
        if not plain_password or not isinstance(plain_password, str):
            print("Invalid password type or empty")
            return False
        
        if not hashed_password:
            print("No hashed password provided")
            return False
        
        return pwd_context.verify(plain_password, hashed_password)
        
    except Exception as e:
        print(f"Error verifying password: {str(e)}")
        return False
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

def authenticate_user(db: Session, correo: str, password: str) -> Optional[Usuario]:
    """Autentica un usuario"""
    print(f"Attempting to authenticate user: {correo}")
    
    try:
        if not correo or not password:
            print("Email or password not provided")
            return None
        
        usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
        
        if not usuario:
            print(f"User {correo} not found")
            return None
        
        print(f"User found: {usuario.correo}")
        
        if not usuario.password:
            print("No password hash found for user")
            return None
        
        print(f"Stored password hash starts with: {usuario.password[:10]}...")
        
        # Verify the password
        is_valid = verify_password(password, usuario.password)
        print(f"Password valid: {is_valid}")
        
        if not is_valid:
            print("Invalid password")
            return None
        
        return usuario
        
    except Exception as e:
        print(f"Error during authentication: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

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
