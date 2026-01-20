from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from app.database import get_db
from app.config import settings
from app.schemas.auth import (
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    Token,
    TokenRefresh,
    TokenData,
    TokenValidate
)
from app.services.token_service import (
    create_access_token,
    create_refresh_token,
    authenticate_user,
    decode_token,
    revoke_token,
    is_token_revoked
)
from app.services.user_service import (
    get_usuario_by_id,
    get_usuario_by_correo,
    create_usuario,
    update_ultimo_login
)
from app.services.refresh_token_service import (
    create_refresh_token as store_refresh_token,
    is_refresh_token_valid,
    invalidate_refresh_token,
    invalidate_all_refresh_tokens
)
from app.utils.rate_limiter import rate_limiter

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario
    
    Crea una nueva cuenta de usuario con email único.
    """
    try:
        # Verificar si el email ya existe
        existing_user = get_usuario_by_correo(db, usuario.correo)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado"
            )
        
        # Crear nuevo usuario
        db_usuario = create_usuario(
            db=db,
            correo=usuario.correo,
            nombre=usuario.nombre,
            password=usuario.password,
            rol=usuario.rol or "cliente"
        )
        
        return db_usuario
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar: {str(e)}"
        )

@router.post("/login", response_model=Token)
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Iniciar sesión y obtener tokens JWT
    
    Devuelve:
    - access_token: Token de corta duración para acceder a APIs
    - refresh_token: Token de larga duración para renovar access_token
    - user: Información del usuario autenticado
    """
    # Rate limiting
    if not rate_limiter.is_allowed(
        usuario.correo,
        settings.RATE_LIMIT_LOGIN,
        settings.RATE_LIMIT_LOGIN_MINUTES
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos de login. Intenta más tarde."
        )
    
    # Autenticar usuario
    db_usuario = authenticate_user(db, usuario.correo, usuario.password)
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Actualizar último login
    update_ultimo_login(db, db_usuario.id_usuario)
    
    # Crear tokens
    access_token = create_access_token(
        str(db_usuario.id_usuario),
        db_usuario.correo,
        db_usuario.rol
    )
    
    refresh_token = create_refresh_token(
        str(db_usuario.id_usuario),
        db_usuario.correo,
        db_usuario.rol
    )
    
    # Almacenar refresh token en BD
    store_refresh_token(
        db,
        db_usuario.id_usuario,
        refresh_token,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Resetear intentos de rate limiting
    rate_limiter.reset(usuario.correo)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": db_usuario
    }

@router.post("/refresh", response_model=Token)
def refresh(
    request: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Renovar access token usando refresh token
    
    Devuelve un nuevo access_token válido.
    """
    # Validar refresh token
    if not is_refresh_token_valid(db, request.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado"
        )
    
    # Decodificar token
    token_data = decode_token(request.refresh_token)
    if not token_data or token_data.tipo != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Obtener usuario
    db_usuario = get_usuario_by_id(db, token_data.id_usuario)
    if not db_usuario or not db_usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    # Crear nuevo access token
    new_access_token = create_access_token(
        str(db_usuario.id_usuario),
        db_usuario.correo,
        db_usuario.rol
    )
    
    # Crear nuevo refresh token
    new_refresh_token = create_refresh_token(
        str(db_usuario.id_usuario),
        db_usuario.correo,
        db_usuario.rol
    )
    
    # Almacenar nuevo refresh token
    store_refresh_token(
        db,
        db_usuario.id_usuario,
        new_refresh_token,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Invalidar refresh token anterior
    invalidate_refresh_token(db, request.refresh_token)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": db_usuario
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    authorization: Optional[str] = Header(None),
    refresh_token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Logout: Revocar tokens
    
    Envía el access token en el header Authorization: Bearer {token}
    y opcionalmente el refresh token en el body.
    """
    # Extraer access token del header
    access_token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            access_token = parts[1]
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access token requerido en header Authorization"
        )
    
    # Decodificar access token
    token_data = decode_token(access_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Revocar access token
    if token_data.exp:
        revoke_token(
            access_token,
            token_data.id_usuario,
            "access",
            "logout",
            token_data.exp,
            db
        )
    
    # Revocar refresh token si se proporciona
    if refresh_token:
        refresh_token_data = decode_token(refresh_token)
        if refresh_token_data and refresh_token_data.exp:
            revoke_token(
                refresh_token,
                token_data.id_usuario,
                "refresh",
                "logout",
                refresh_token_data.exp,
                db
            )
        invalidate_refresh_token(db, refresh_token)
    else:
        # Invalidar todos los refresh tokens del usuario
        invalidate_all_refresh_tokens(db, token_data.id_usuario)
    
    return {"message": "Logout exitoso"}

@router.get("/me", response_model=UsuarioResponse)
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Obtener información del usuario autenticado
    
    Valida el access token y devuelve los datos del usuario.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token requerido"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido"
        )
    
    token = parts[1]
    
    # Verificar si el token está revocado
    if is_token_revoked(token, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revocado"
        )
    
    # Decodificar token
    token_data = decode_token(token)
    if not token_data or token_data.tipo != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    # Obtener usuario
    usuario = get_usuario_by_id(db, token_data.id_usuario)
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return usuario

@router.post("/validate", response_model=TokenData)
def validate_token(
    request: TokenValidate,
    db: Session = Depends(get_db)
):
    """
    Endpoint interno para validar tokens
    
    **Uso interno**: Llamado por otros microservicios para validar tokens.
    No debe exponerse públicamente.
    """
    # Verificar si el token está revocado
    if is_token_revoked(request.token, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revocado"
        )
    
    # Decodificar token
    token_data = decode_token(request.token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    return token_data
