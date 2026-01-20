# Auth Service Integration Guide

## Cambios en el REST API

El REST API ahora se integra con el **Auth Service** para autenticación. Los cambios principales son:

### 1. El Auth Service ahora gestiona:
- ✅ Registro de usuarios
- ✅ Login y generación de tokens JWT
- ✅ Renovación de tokens (refresh)
- ✅ Logout y revocación de tokens
- ✅ Almacenamiento de usuarios y refresh tokens

### 2. El REST API ahora:
- ✅ Valida tokens JWT **localmente** sin consultar Auth Service en cada request
- ✅ Utiliza la `SECRET_KEY` compartida del Auth Service
- ✅ Las rutas de autenticación (`/auth/register`, `/auth/login`, etc) se han movido al Auth Service
- ✅ Mantiene la lógica de negocio CRUD para otros recursos

## Endpoints de Autenticación (ahora en Auth Service)

**Base URL:** `http://localhost:8001/api/v1`

```
POST   /auth/register        - Registrar usuario
POST   /auth/login           - Iniciar sesión
POST   /auth/logout          - Cerrar sesión
POST   /auth/refresh         - Renovar access token
GET    /auth/me              - Datos del usuario autenticado
POST   /auth/validate        - Validar token (interno)
```

## Endpoints del REST API (sin autenticación)

**Base URL:** `http://localhost:8000/api/v1`

```
GET    /peliculas            - Listar películas (público)
GET    /peliculas/{id}       - Obtener película (público)
GET    /salas                - Listar salas (público)
GET    /funciones            - Listar funciones (público)
...
```

## Endpoints del REST API (requieren autenticación)

```
GET    /usuarios             - Listar usuarios (admin)
GET    /usuarios/me          - Datos del usuario actual (autenticado)
POST   /reservas             - Crear reserva (autenticado)
...
```

## Cómo se valida el token

### Antes (antipatrón):
```
Cliente → REST API → Auth Service (en cada request)
   ✗ Overhead de comunicación en cada petición
```

### Después (patrón correcto):
```
Cliente → Auth Service (solo login/register/refresh)
   ↓
Auth Service devuelve JWT
   ↓
Cliente → REST API (con JWT en header)
   ↓
REST API valida JWT LOCALMENTE
   ✓ Sin comunicación con Auth Service en cada request
```

## Headers para peticiones autenticadas

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Ejemplo de flujo

1. **Registro:**
   ```bash
   POST http://localhost:8001/api/v1/auth/register
   {
     "correo": "user@example.com",
     "nombre": "Juan",
     "password": "pass123"
   }
   ```

2. **Login:**
   ```bash
   POST http://localhost:8001/api/v1/auth/login
   {
     "correo": "user@example.com",
     "password": "pass123"
   }
   
   Response:
   {
     "access_token": "eyJ0...",
     "refresh_token": "eyJ0...",
     "token_type": "bearer",
     "user": {...}
   }
   ```

3. **Usar token en REST API:**
   ```bash
   GET http://localhost:8000/api/v1/usuarios/me
   Headers:
     Authorization: Bearer eyJ0...
   ```

4. **Cuando access_token expira (15 min), renovar:**
   ```bash
   POST http://localhost:8001/api/v1/auth/refresh
   {
     "refresh_token": "eyJ0..."
   }
   
   Response: nuevo access_token
   ```

5. **Logout:**
   ```bash
   POST http://localhost:8001/api/v1/auth/logout
   Headers:
     Authorization: Bearer eyJ0...
   ```

## Configuración en .env

```env
# REST API
DATABASE_URL=postgresql://user:password@localhost/cinema
SECRET_KEY=your-secret-key-same-as-auth-service

# Auth Service URL
AUTH_SERVICE_URL=http://localhost:8001
```

## Rutas con autenticación opcional/requerida

### Proteger un endpoint:

```python
from fastapi import Depends
from app.utils.auth import get_current_user, TokenData

@router.get("/usuarios/me")
def get_my_profile(current_user: TokenData = Depends(get_current_user)):
    """Obtener perfil del usuario autenticado"""
    return {
        "id_usuario": current_user.id_usuario,
        "correo": current_user.correo,
        "rol": current_user.rol
    }
```

### Solo para admins:

```python
from app.utils.auth import get_current_admin

@router.delete("/usuarios/{id}")
def delete_usuario(id: str, current_user: TokenData = Depends(get_current_admin)):
    """Eliminar usuario - solo admin"""
    ...
```

## Migración de datos (si es necesario)

Si tienes usuarios en la BD del REST anterior:

1. El Auth Service tiene BD propia (por defecto SQLite)
2. Necesitas migrar los usuarios existentes al Auth Service:
   ```python
   # Script de migración
   from backend.auth_service.app.services.user_service import create_usuario
   from backend.api_rest.app.models import Usuario
   
   # Leer usuarios del REST
   existing_users = db.query(Usuario).all()
   
   # Crear en Auth Service
   for user in existing_users:
       create_usuario(
           db_auth,
           user.correo,
           user.nombre,
           user.password  # Ya hasheadas
       )
   ```

## Notas importantes

- El `SECRET_KEY` debe ser igual en Auth Service y REST API
- El REST API NO almacena usuarios, solo valida tokens
- Los refresh tokens solo se pueden usar en `/auth/refresh`
- Los access tokens expiran en 15 minutos (configurable)
- Los refresh tokens expiran en 7 días (configurable)

## Ventajas de esta arquitectura

✅ **Separación de responsabilidades**: Auth Service solo para autenticación  
✅ **Sin overhead**: Validación local sin consultas HTTP en cada request  
✅ **Escalabilidad**: Múltiples instancias del REST sin impacto  
✅ **Seguridad**: Tokens revocables, rate limiting en login  
✅ **Reutilizable**: GraphQL y WebSocket también validan localmente  
