from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioResponse, UsuarioLogin, Token
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_password_hash
)
from app.config import settings

router = APIRouter()

# Schema para respuesta de login con usuario
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

@router.post("/auth/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    try:
        print(f"Registering user with email: {usuario.correo}")
        
        # Verificar si el correo ya existe
        db_usuario = db.query(Usuario).filter(Usuario.correo == usuario.correo).first()
        if db_usuario:
            print(f"Email {usuario.correo} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado"
            )
        
        # Crear nuevo usuario con password hasheado
        print("Hashing password...")
        hashed_password = get_password_hash(usuario.password)
        
        print("Creating user object...")
        db_usuario = Usuario(
            nombre=usuario.nombre,
            correo=usuario.correo,
            password=hashed_password,
            rol=usuario.rol or "cliente"
        )
        
        print("Adding user to database...")
        db.add(db_usuario)
        db.commit()
        db.refresh(db_usuario)
        
        print(f"User created successfully with ID: {db_usuario.id_usuario}")
        return db_usuario
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar el usuario: {str(e)}"
        )

@router.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Iniciar sesión y obtener token JWT"""
    usuario = authenticate_user(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": usuario.correo}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/login-json", response_model=LoginResponse)
def login_json(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Login alternativo que acepta JSON en lugar de form-data y retorna datos del usuario"""
    usuario_db = authenticate_user(db, usuario.correo, usuario.password)
    
    if not usuario_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": usuario_db.correo}, expires_delta=access_token_expires
    )
    
    # Retornar token junto con los datos del usuario (sin password)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": usuario_db  # UsuarioResponse se encargará de excluir el password automáticamente
    }