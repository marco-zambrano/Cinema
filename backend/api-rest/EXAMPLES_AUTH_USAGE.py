"""
EJEMPLO: Cómo actualizar endpoints del REST API para usar el Auth Service

Este archivo muestra ejemplos de cómo integrar la autenticación del Auth Service
en los endpoints existentes del REST API.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.utils.auth import get_current_user, TokenData

router = APIRouter()

# ============================================================================
# EJEMPLOS DE ENDPOINTS SIN AUTENTICACIÓN (público)
# ============================================================================

@router.get("/peliculas")
def list_peliculas():
    """
    Listar películas - SIN autenticación requerida
    Cualquiera puede ver las películas disponibles
    """
    # ... lógica para listar películas
    pass

# ============================================================================
# EJEMPLOS DE ENDPOINTS CON AUTENTICACIÓN REQUERIDA
# ============================================================================

@router.post("/reservas")
def crear_reserva(
    # ... otros parámetros
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear una reserva - REQUIERE autenticación
    
    El usuario debe enviar un token válido en el header:
    Authorization: Bearer {access_token}
    
    Acceso a datos del usuario autenticado:
    - current_user.id_usuario
    - current_user.correo
    - current_user.rol
    """
    # El usuario está autenticado
    print(f"Usuario autenticado: {current_user.correo}")
    
    # Usar el ID del usuario para la reserva
    # ... lógica de negocio
    pass

@router.get("/usuarios/me")
def get_perfil(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener perfil del usuario actual - REQUIERE autenticación
    
    Respuesta:
    {
        "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
        "correo": "user@example.com",
        "rol": "cliente"
    }
    """
    return {
        "id_usuario": current_user.id_usuario,
        "correo": current_user.correo,
        "rol": current_user.rol
    }

# ============================================================================
# ENDPOINTS CON AUTENTICACIÓN Y ROL ESPECÍFICO
# ============================================================================

from app.utils.auth import get_current_admin

@router.delete("/usuarios/{id_usuario}")
def eliminar_usuario(
    id_usuario: str,
    current_user: TokenData = Depends(get_current_admin),  # Solo admin
    db: Session = Depends(get_db)
):
    """
    Eliminar usuario - SOLO ADMIN
    
    Si current_user.rol != "admin", se lanza una excepción 403 Forbidden
    """
    # Solo admins pueden llegar aquí
    print(f"Admin {current_user.correo} eliminando usuario {id_usuario}")
    
    # ... lógica para eliminar usuario
    pass

# ============================================================================
# ENDPOINTS CON AUTENTICACIÓN OPCIONAL
# ============================================================================

from typing import Optional

@router.get("/peliculas/{id}")
def get_pelicula(
    id: str,
    current_user: Optional[TokenData] = None,  # Opcional
    db: Session = Depends(get_db)
):
    """
    Obtener película - autenticación OPCIONAL
    
    Si el usuario proporciona token, se valida.
    Si no, se sigue sin validar.
    
    Nota: Para esto necesitas crear una versión "opcional" del dependency
    """
    if current_user:
        # Si está autenticado, hacer algo especial
        print(f"Usuario autenticado: {current_user.correo}")
        # Ej: retornar información adicional
    else:
        print("Usuario anónimo")
    
    # ... lógica para obtener película
    pass

# ============================================================================
# CÓMO MODIFICAR RUTAS EXISTENTES
# ============================================================================

"""
ANTES (autenticación local en REST):
@router.post("/reservas")
def crear_reserva(reserva: ReservaCreate, token: str = Depends(oauth2_scheme)):
    # Validar token consultando BD local
    usuario = validate_token_local_db(token)
    ...

DESPUÉS (autenticación del Auth Service):
@router.post("/reservas")
def crear_reserva(
    reserva: ReservaCreate,
    current_user: TokenData = Depends(get_current_user)
):
    # get_current_user valida JWT LOCALMENTE
    # sin consultar Auth Service
    usuario_id = current_user.id_usuario
    ...
"""

# ============================================================================
# INTEGRACIÓN CON BD EXISTENTE
# ============================================================================

"""
Si tu modelo Usuario tiene campos adicionales que necesitas:

@router.get("/usuarios/me/completo")
def get_perfil_completo(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # El TokenData solo tiene: id_usuario, correo, rol
    # Si necesitas más datos, buscar en BD local del REST
    
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == current_user.id_usuario
    ).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return usuario
"""

# ============================================================================
# MANEJO DE ERRORES DE AUTENTICACIÓN
# ============================================================================

"""
Los errores de autenticación son manejados automáticamente por get_current_user:

- 401 Unauthorized: Token inválido, expirado o faltante
- 403 Forbidden: Token válido pero permisos insuficientes (rol)

NO necesitas manejarlos, FastAPI devuelve automáticamente:
{
    "detail": "Token inválido o expirado"
}
"""

# ============================================================================
# TESTING
# ============================================================================

"""
Para testear endpoints protegidos:

import requests

# 1. Obtener token del Auth Service
response = requests.post(
    "http://localhost:8001/api/v1/auth/login",
    json={
        "correo": "user@example.com",
        "password": "password123"
    }
)
token = response.json()["access_token"]

# 2. Usar token en requests al REST API
headers = {
    "Authorization": f"Bearer {token}"
}

response = requests.get(
    "http://localhost:8000/api/v1/usuarios/me",
    headers=headers
)
print(response.json())
"""
