# Arquitectura de Autenticación - Microservicio de Auth

## Descripción General

Se ha implementado un **microservicio de autenticación independiente** que centraliza la gestión de usuarios y tokens JWT. Este servicio evita el antipatrón de consultar constantemente un servicio de autenticación en cada request.

## Componentes

### 1. Auth Service (Puerto 8001)
**Ubicación:** `backend/auth-service/`

**Responsabilidades:**
- Gestión de usuarios (registro)
- Generación de tokens JWT (access y refresh)
- Revocación de tokens (logout)
- Rate limiting en login

**Base de Datos:**
- SQLite local (configurable en .env)
- Tablas: Usuario, RefreshToken, RevokedToken

**Endpoints:**
```
POST   /api/v1/auth/register   - Registrar usuario
POST   /api/v1/auth/login      - Iniciar sesión
POST   /api/v1/auth/logout     - Cerrar sesión
POST   /api/v1/auth/refresh    - Renovar token
GET    /api/v1/auth/me         - Datos del usuario actual
POST   /api/v1/auth/validate   - Validar token (interno)
```

### 2. REST API (Puerto 8000)
**Ubicación:** `backend/api-rest/`

**Responsabilidades:**
- CRUD de películas, salas, funciones, asientos, reservas
- Validación LOCAL de JWT (sin consultar Auth Service en cada request)
- Lógica de negocio

**Cambios:**
- Usa `utils/auth.py` para validar tokens localmente
- Endpoints `/auth/*` se han movido al Auth Service
- Endpoints protegidos usan `get_current_user` dependency

### 3. GraphQL (Puerto 3001)
**Ubicación:** `backend/graphql-nest/`

**Responsabilidades:**
- Queries personalizadas de datos
- Validación LOCAL de JWT
- Caché de consultas frecuentes

**Cambios necesarios:**
- Implementar JwtAuthGuard para validación local
- Usar `SECRET_KEY` del Auth Service

### 4. WebSocket (Puerto 8080)
**Ubicación:** `backend/websocket-go/`

**Responsabilidades:**
- Comunicación en tiempo real
- Validación LOCAL de JWT en conexión
- Broadcasting de eventos

**Cambios necesarios:**
- Validar token JWT en handshake de conexión
- Usar `SECRET_KEY` del Auth Service

## Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Frontend)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    1. REGISTRO/LOGIN
                           │
                           ▼
         ┌──────────────────────────────────────┐
         │    AUTH SERVICE (Puerto 8001)         │
         │                                        │
         │  • Autentica usuario                  │
         │  • Genera access_token (15 min)       │
         │  • Genera refresh_token (7 días)      │
         │  • Almacena refresh_token en BD       │
         │                                        │
         │  Base de Datos:                       │
         │  • Usuario                            │
         │  • RefreshToken                       │
         │  • RevokedToken (blacklist)           │
         └──────────────────────────────────────┘
                           │
                  2. Devuelve tokens
                           │
                           ▼
         ┌──────────────────────────────────────┐
         │         CLIENTE almacena tokens      │
         │  • access_token en memoria            │
         │  • refresh_token en localStorage      │
         └──────────────────────────────────────┘
                           │
        3. Usa access_token en Authorization header
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    REST API        GraphQL          WebSocket
    (8000)          (3001)            (8080)
          │                │                │
          └─────┬──────────┼────────────────┘
                │          │
      4. VALIDACIÓN LOCAL (sin consultar Auth Service)
                │          │
                │    Valida JWT usando:
                │    • SECRET_KEY
                │    • Verifica firma
                │    • Verifica expiración
                │
                ▼
         Token válido → Procesa request
         Token inválido → Error 401

   5. Si access_token expira:
      Cliente usa refresh_token → Auth Service
      Auth Service valida refresh_token
      Auth Service genera nuevo access_token
```

## Tokens JWT

### Access Token
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "user@example.com",
  "rol": "cliente",
  "type": "access",
  "exp": 1705432800,
  "iat": 1705432200
}
```
- **Duración:** 15 minutos (configurable)
- **Uso:** Autorización en requests
- **Ubicación:** Header `Authorization: Bearer {token}`

### Refresh Token
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "user@example.com",
  "rol": "cliente",
  "type": "refresh",
  "exp": 1706643600,
  "iat": 1705432200
}
```
- **Duración:** 7 días (configurable)
- **Uso:** Renovar access token
- **Ubicación:** Body de request a `/auth/refresh`

## Validación Local

### Ventajas
✅ **Sin overhead de HTTP:** Validación directa sin llamadas de red  
✅ **Escalabilidad:** Múltiples instancias del REST sin cuello de botella  
✅ **Latencia baja:** Validación instantánea  
✅ **Resiliencia:** Si Auth Service cae, los tokens en circulación siguen siendo válidos  

### Cómo funciona
```python
# En cada request protegido del REST
token = extract_token_from_header(request)

# Validación LOCAL (sin HTTP request)
decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

# Verificaciones
if decoded['exp'] < datetime.utcnow().timestamp():
    raise HTTPException(401, "Token expirado")

# Token válido, procesar request
current_user = TokenData(decoded)
```

## Blacklist de Tokens

### Tokens Revocados
Se almacenan en `RevokedToken` tabla para:
- **Logout:** Revocar token inmediatamente
- **Cambio de password:** Invalidar todos los tokens existentes
- **Eliminación de usuario:** Revocar acceso

### Validación
Aunque el token sea válido por firma, se verifica si está en blacklist:
```python
if is_token_revoked(token, db):
    raise HTTPException(401, "Token revocado")
```

## Rate Limiting

### Login
- **Máximo:** 5 intentos
- **Ventana:** 15 minutos
- **Por:** Email del usuario

**Respuesta al exceder:**
```json
{
  "detail": "Demasiados intentos de login. Intenta más tarde."
}
```

## Flujos de Uso

### 1. Registro
```bash
POST http://localhost:8001/api/v1/auth/register
{
  "correo": "user@example.com",
  "nombre": "Juan Pérez",
  "password": "secure_password",
  "rol": "cliente"
}

Response: 201
{
  "id_usuario": "550e8400...",
  "correo": "user@example.com",
  "nombre": "Juan Pérez",
  "rol": "cliente",
  "activo": true,
  "fecha_creacion": "2025-01-16T..."
}
```

### 2. Login
```bash
POST http://localhost:8001/api/v1/auth/login
{
  "correo": "user@example.com",
  "password": "secure_password"
}

Response: 200
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {...}
}
```

### 3. Usar en REST API
```bash
GET http://localhost:8000/api/v1/usuarios/me
Headers:
  Authorization: Bearer eyJhbGci...

Response: 200
{
  "id_usuario": "550e8400...",
  "correo": "user@example.com",
  "rol": "cliente"
}
```

### 4. Renovar token (access_token expirado)
```bash
POST http://localhost:8001/api/v1/auth/refresh
{
  "refresh_token": "eyJhbGci..."
}

Response: 200
{
  "access_token": "eyJhbGci...",  # NUEVO
  "refresh_token": "eyJhbGci...", # NUEVO (rotación)
  "token_type": "bearer",
  "user": {...}
}
```

### 5. Logout
```bash
POST http://localhost:8001/api/v1/auth/logout
Headers:
  Authorization: Bearer eyJhbGci...
Body (opcional):
{
  "refresh_token": "eyJhbGci..."
}

Response: 200
{
  "message": "Logout exitoso"
}
```

## Configuración

### Auth Service (.env)
```env
DATABASE_URL=sqlite:///./auth.db
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
RATE_LIMIT_LOGIN=5
RATE_LIMIT_LOGIN_MINUTES=15
DEBUG=True
```

### REST API (.env)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
AUTH_SERVICE_URL=http://localhost:8001
```

**⚠️ IMPORTANTE:** La `SECRET_KEY` DEBE ser igual en Auth Service y REST API (y otros servicios)

## Implementación en otros servicios

### GraphQL (NestJS)
1. Instalar `@nestjs/jwt`
2. Crear `JwtAuthGuard`
3. Usar `@UseGuards(JwtAuthGuard)` en resolvers

Ver: `backend/graphql-nest/AUTH_INTEGRATION.md`

### WebSocket (Go)
1. Instalar `github.com/golang-jwt/jwt/v5`
2. Crear validador de tokens
3. Validar en handshake de conexión

Ver: `backend/websocket-go/AUTH_INTEGRATION.md`

## Seguridad

### ✅ Implementado
- Passwords hasheados con bcrypt (1.200 iteraciones)
- JWT firmados con HS256
- Tokens de corta duración (15 min para access)
- Refresh tokens con rotación automática
- Rate limiting en login
- Blacklist de tokens revocados
- CORS configurado
- Validación de email único

### ⚠️ Recomendaciones para Producción
- Usar `https://` (no `http://`)
- Cambiar `SECRET_KEY` a valor fuerte
- Configurar CORS específicamente (no `*`)
- Usar Base de Datos Postgres (no SQLite)
- Implementar logging y auditoría
- Realizar renovación regular de secrets
- Implementar 2FA (autenticación de dos factores)
- Configurar OWASP completa

## Troubleshooting

### "Token inválido"
- Verificar que `SECRET_KEY` es igual en todos los servicios
- Verificar que el token no está expirado
- Verificar que el formato es `Bearer {token}`

### "Token revocado"
- El usuario hizo logout
- El usuario cambió contraseña
- El token está en la blacklist

### "Demasiados intentos"
- Esperar 15 minutos
- O cambiar IP/dispositivo

### Auth Service no inicia
- Verificar `.env` está en `backend/auth-service/`
- Verificar `SECRET_KEY` no está vacía
- Revisar permisos de carpeta

## Próximos pasos

1. [ ] Actualizar endpoints del REST API para usar `get_current_user`
2. [ ] Implementar validación en GraphQL
3. [ ] Implementar validación en WebSocket
4. [ ] Migrar usuarios existentes a Auth Service (si aplica)
5. [ ] Implementar logging y auditoría
6. [ ] Configurar variables de entorno seguras en producción
7. [ ] Implementar 2FA
8. [ ] Configurar renovación automática de refresh tokens en frontend
