# Auth Service - Microservicio de Autenticación

Microservicio independiente dedicado a la gestión de autenticación, tokens JWT y usuarios.

## Características

- ✅ **JWT con Access y Refresh Tokens**: Tokens de corta duración + renovación segura
- ✅ **Validación Local**: Los demás servicios validan tokens sin consultar este servicio en cada request
- ✅ **Base de Datos Propia**: Tablas para usuarios, refresh tokens y tokens revocados
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta en login
- ✅ **Blacklist de Tokens**: Registro de tokens revocados
- ✅ **Seguridad**: Passwords con hash bcrypt, tokens firmados

## Endpoints

### Autenticación Pública

- **POST** `/api/v1/auth/register` - Registrar nuevo usuario
  ```json
  {
    "correo": "user@example.com",
    "nombre": "Juan Pérez",
    "password": "secure_password",
    "rol": "cliente"
  }
  ```

- **POST** `/api/v1/auth/login` - Iniciar sesión
  ```json
  {
    "correo": "user@example.com",
    "password": "secure_password"
  }
  ```
  **Response:**
  ```json
  {
    "access_token": "eyJ0...",
    "refresh_token": "eyJ0...",
    "token_type": "bearer",
    "user": {...}
  }
  ```

- **POST** `/api/v1/auth/refresh` - Renovar access token
  ```json
  {
    "refresh_token": "eyJ0..."
  }
  ```

- **POST** `/api/v1/auth/logout` - Cerrar sesión y revocar tokens
  - Header: `Authorization: Bearer {access_token}`
  - Body (opcional): `{"refresh_token": "eyJ0..."}`

### Autenticación Protegida

- **GET** `/api/v1/auth/me` - Obtener datos del usuario autenticado
  - Header: `Authorization: Bearer {access_token}`

### Endpoints Internos (para otros microservicios)

- **POST** `/api/v1/auth/validate` - Validar token (solo desde otros servicios)
  ```json
  {
    "token": "eyJ0..."
  }
  ```
  **Response:** Token data decodificado

## Instalación

```bash
cd backend/auth-service
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
```

## Configuración

Editar `.env`:
```env
DATABASE_URL=sqlite:///./auth.db
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
RATE_LIMIT_LOGIN=5
RATE_LIMIT_LOGIN_MINUTES=15
```

## Ejecutar

```bash
uvicorn app.main:app --reload --port 8001
```

Acceder a:
- Swagger UI: http://localhost:8001/api/v1/docs
- ReDoc: http://localhost:8001/api/v1/redoc

## Flujo de Autenticación

```
1. Usuario hace POST /auth/login con credenciales
   ↓
2. Auth Service verifica contraseña y crea tokens
   ↓
3. Devuelve: access_token (15 min) + refresh_token (7 días)
   ↓
4. Cliente usa access_token en Authorization header para otros servicios
   ↓
5. Otros servicios validan token LOCALMENTE sin consultar Auth Service
   ↓
6. Cuando access_token expira, cliente usa refresh_token en /auth/refresh
   ↓
7. Auth Service valida refresh_token y emite nuevo access_token
```

## Validación Local en Otros Servicios

Los otros microservicios (REST, GraphQL, WebSocket) reciben la `SECRET_KEY` y pueden validar tokens localmente:

```python
from jose import jwt
from datetime import datetime

def validate_token_locally(token: str, secret_key: str):
    """Validar token sin consultar Auth Service"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        id_usuario = payload.get("id_usuario")
        correo = payload.get("correo")
        rol = payload.get("rol")
        exp = payload.get("exp")
        
        # Verificar expiración
        if exp < datetime.utcnow().timestamp():
            return None  # Token expirado
        
        return {
            "id_usuario": id_usuario,
            "correo": correo,
            "rol": rol
        }
    except JWTError:
        return None  # Token inválido
```

## Seguridad

- Passwords hasheados con bcrypt
- Tokens firmados con HS256
- Rate limiting en login (5 intentos cada 15 minutos)
- Blacklist de tokens revocados
- Tokens de acceso corta duración (15 minutos)
- Refresh tokens con expiración larga (7 días)

## Modelos de BD

### Usuario
- id_usuario (UUID) - Primary Key
- correo (String) - Unique
- nombre (String)
- password (Text) - Hasheado
- rol (String) - Default: "cliente"
- activo (Boolean)
- fecha_creacion (DateTime)
- ultimo_login (DateTime)

### RefreshToken
- id_token (UUID) - Primary Key
- id_usuario (UUID) - Foreign Key
- token (Text) - Unique
- fecha_creacion (DateTime)
- fecha_expiracion (DateTime)
- activo (Boolean)

### RevokedToken
- id_token_revocado (UUID) - Primary Key
- token (Text) - Unique
- id_usuario (UUID) - Foreign Key
- tipo_token (String) - "access" o "refresh"
- fecha_revocacion (DateTime)
- fecha_expiracion_original (DateTime)
- razon (String) - "logout", "password_change", etc

## Integración con REST API

El servicio REST anterior debe ser actualizado para:
1. Eliminar lógica de autenticación local
2. Utilizar los tokens JWT del Auth Service
3. Validar tokens LOCALMENTE usando la SECRET_KEY

Ver: `backend/api-rest/AUTH_INTEGRATION.md`
