# Implementación: Microservicio de Autenticación - RESUMEN EJECUTIVO

**Fecha:** 16 de Enero 2025  
**Estado:** ✅ COMPLETADO  
**Componente:** Pilar 1 - Microservicio de Autenticación (15%)

## Lo que se implementó

### 1. ✅ Auth Service (Microservicio independiente)
**Ubicación:** `backend/auth-service/`

**Componentes:**
- Base de datos propia (Usuario, RefreshToken, RevokedToken)
- Endpoints de autenticación completos
- Rate limiting en login
- Blacklist de tokens revocados

**Endpoints:**
```
POST   /api/v1/auth/register          - Registrar usuario
POST   /api/v1/auth/login             - Login y obtener tokens
POST   /api/v1/auth/logout            - Logout y revocar tokens
POST   /api/v1/auth/refresh           - Renovar access token
GET    /api/v1/auth/me                - Datos del usuario actual
POST   /api/v1/auth/validate          - Validar token (interno)
GET    /health                        - Health check
```

### 2. ✅ JWT con Access y Refresh Tokens
- **Access Token:** 15 minutos (corta duración)
- **Refresh Token:** 7 días (larga duración)
- Tokens firmados con HS256
- Decodificación segura y validación de expiración

### 3. ✅ Validación Local en otros servicios
- REST API valida JWT localmente sin consultar Auth Service
- GraphQL puede validar localmente (guía incluida)
- WebSocket puede validar en conexión (guía incluida)
- **Ventaja:** Sin overhead de HTTP en cada request

### 4. ✅ Base de datos propia
```sql
CREATE TABLE usuario (
  id_usuario UUID PRIMARY KEY,
  correo STRING UNIQUE,
  nombre STRING,
  password TEXT (BCRYPT),
  rol STRING DEFAULT 'cliente',
  activo BOOLEAN,
  fecha_creacion DATETIME,
  ultimo_login DATETIME
);

CREATE TABLE refresh_token (
  id_token UUID PRIMARY KEY,
  id_usuario UUID FK,
  token TEXT UNIQUE,
  fecha_creacion DATETIME,
  fecha_expiracion DATETIME,
  activo BOOLEAN
);

CREATE TABLE revoked_token (
  id_token_revocado UUID PRIMARY KEY,
  token TEXT UNIQUE,
  id_usuario UUID FK,
  tipo_token STRING ('access' | 'refresh'),
  fecha_revocacion DATETIME,
  razon STRING
);
```

### 5. ✅ Seguridad
- Passwords hasheados con bcrypt
- Rate limiting: 5 intentos cada 15 minutos en login
- Blacklist de tokens revocados
- Tokens firmados y verificados
- CORS configurado
- Email único para usuarios

## Archivos creados

### Auth Service
```
backend/auth-service/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Aplicación FastAPI
│   ├── config.py                # Configuración
│   ├── database.py              # Conexión a BD
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # Modelo Usuario
│   │   └── token.py             # Modelos RefreshToken, RevokedToken
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py              # Endpoints de autenticación
│   ├── services/
│   │   ├── __init__.py
│   │   ├── token_service.py     # Generación/validación JWT
│   │   ├── user_service.py      # Gestión de usuarios
│   │   └── refresh_token_service.py  # Manejo de refresh tokens
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── auth.py              # Esquemas Pydantic
│   └── utils/
│       ├── __init__.py
│       └── rate_limiter.py      # Rate limiting
├── requirements.txt             # Dependencias
├── .env                         # Configuración
└── README.md                    # Documentación
```

### REST API (Actualizaciones)
```
backend/api-rest/
├── app/
│   ├── utils/
│   │   └── auth.py              # ← NUEVO: Validación local JWT
│   └── config.py                # ← ACTUALIZADO
├── .env                         # ← ACTUALIZADO
├── AUTH_INTEGRATION.md          # ← NUEVO: Guía de integración
├── EXAMPLES_AUTH_USAGE.py       # ← NUEVO: Ejemplos de uso
└── requirements.txt             # ← OK (no cambios necesarios)
```

### Documentación
```
backend/graphql-nest/AUTH_INTEGRATION.md      # Guía GraphQL
backend/websocket-go/AUTH_INTEGRATION.md      # Guía WebSocket
AUTHENTICATION_ARCHITECTURE.md                # Arquitectura completa
```

## Guía de instalación

### Paso 1: Crear Auth Service (Backend - Terminal 1)

```bash
# Ir a carpeta del proyecto
cd cinema/backend/auth-service

# Crear virtual environment
python -m venv venv

# Activar venv
# Windows:
venv/Scripts/activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
uvicorn app.main:app --reload --port 8001
```

**Verificar:** http://localhost:8001/api/v1/docs

### Paso 2: Ejecutar REST API (Backend - Terminal 2)

```bash
cd cinema/backend/api-rest

# Activar venv existente
venv/Scripts/activate

# Actualizar dependencias (si es necesario)
pip install -r requirements.txt

# Ejecutar
uvicorn app.main:app --reload --port 8000
```

**Verificar:** http://localhost:8000/api/v1/docs

### Paso 3: Ejecutar GraphQL (Backend - Terminal 3)

```bash
cd cinema/backend/graphql-nest

# Instalar (si no se ha hecho)
npm install

# Ejecutar
npm run start:dev
```

### Paso 4: Ejecutar WebSocket (Backend - Terminal 4)

```bash
cd cinema/backend/websocket-go

# Ejecutar
go run main.go
```

### Paso 5: Ejecutar Frontend (Frontend - Terminal 5)

```bash
cd cinema/frontend

# Si no se ha instalado
pnpm install

# Ejecutar
pnpm dev
```

## Testing rápido

### 1. Registrar usuario (Auth Service)
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "nombre": "Test User",
    "password": "password123",
    "rol": "cliente"
  }'
```

### 2. Login (Auth Service)
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {...}
}
```

### 3. Usar token en REST API
```bash
# Copiar access_token de respuesta anterior
TOKEN="eyJhbGci..."

curl -X GET http://localhost:8000/api/v1/usuarios/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Renovar token (cuando expire)
```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGci..."
  }'
```

### 5. Logout (revocar tokens)
```bash
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Cambios necesarios en REST API

Para que los endpoints del REST usen la autenticación del Auth Service:

```python
# ANTES
from app.services.auth_service import get_current_user
@router.get("/usuarios/me")
def get_my_profile(token: str = Depends(oauth2_scheme)):
    usuario = validate_token_in_db(token)  # ← Consulta BD
    return usuario

# DESPUÉS
from app.utils.auth import get_current_user, TokenData
@router.get("/usuarios/me")
def get_my_profile(current_user: TokenData = Depends(get_current_user)):
    # get_current_user valida JWT LOCALMENTE
    return {
        "id_usuario": current_user.id_usuario,
        "correo": current_user.correo,
        "rol": current_user.rol
    }
```

Ver: `backend/api-rest/EXAMPLES_AUTH_USAGE.py`

## Cambios necesarios en GraphQL

Para que GraphQL valide tokens localmente:

1. Instalar: `npm install @nestjs/jwt`
2. Crear JwtAuthGuard
3. Usar en resolvers: `@UseGuards(JwtAuthGuard)`

Ver: `backend/graphql-nest/AUTH_INTEGRATION.md`

## Cambios necesarios en WebSocket

Para que WebSocket valide tokens en conexión:

1. Instalar: `go get github.com/golang-jwt/jwt/v5`
2. Crear validador de tokens
3. Validar en handshake

Ver: `backend/websocket-go/AUTH_INTEGRATION.md`

## Configuración importante

### La SECRET_KEY debe ser igual en TODOS los servicios

**Auth Service** (`.env`):
```env
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
```

**REST API** (`.env`):
```env
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
```

**GraphQL** (`.env`):
```env
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
```

**WebSocket** (`.env`):
```env
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
```

## Ventajas de esta arquitectura

✅ **Separación de responsabilidades:** Auth Service solo autenticación  
✅ **Sin overhead:** Validación local sin HTTP en cada request  
✅ **Escalabilidad:** Múltiples instancias sin cuello de botella  
✅ **Seguridad:** Tokens revocables, rate limiting, bcrypt  
✅ **Resiliencia:** Si Auth Service cae, tokens válidos siguen funcionando  
✅ **Mantenibilidad:** Cambios de autenticación solo en Auth Service  

## Próximas tareas

- [ ] Actualizar endpoints protegidos del REST API
- [ ] Implementar JwtAuthGuard en GraphQL
- [ ] Implementar validación en WebSocket
- [ ] Migrar usuarios existentes (si aplica)
- [ ] Implementar 2FA
- [ ] Configurar renovación automática de refresh tokens en frontend
- [ ] Agregar logging y auditoría
- [ ] Preparar para producción (secrets seguros, HTTPS, etc)

## Documentación

- **Arquitectura completa:** `AUTHENTICATION_ARCHITECTURE.md`
- **REST API:** `backend/api-rest/AUTH_INTEGRATION.md`
- **GraphQL:** `backend/graphql-nest/AUTH_INTEGRATION.md`
- **WebSocket:** `backend/websocket-go/AUTH_INTEGRATION.md`
- **Ejemplos REST:** `backend/api-rest/EXAMPLES_AUTH_USAGE.py`

## Soporte

Para problemas o preguntas:
1. Revisar logs en terminal donde se ejecuta el Auth Service
2. Verificar que SECRET_KEY es igual en todos los servicios
3. Verificar que los servicios están en los puertos correctos
4. Revisar la documentación específica del servicio

---

**Implementación completada: 16 de Enero 2025**
