## 🚀 Quick Start - Microservicio de Autenticación

### 1️⃣ Terminal 1: Auth Service
```bash
cd backend/auth-service
python -m venv venv
venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
✅ Acceso: http://localhost:8001/api/v1/docs

---

### 2️⃣ Terminal 2: REST API
```bash
cd backend/api-rest
venv/Scripts/activate  # Venv existente
uvicorn app.main:app --reload --port 8000
```
✅ Acceso: http://localhost:8000/api/v1/docs

---

### 3️⃣ Terminal 3: GraphQL
```bash
cd backend/graphql-nest
npm install
npm run start:dev
```
✅ Acceso: http://localhost:3001/graphql

---

### 4️⃣ Terminal 4: WebSocket
```bash
cd backend/websocket-go
go run main.go
```
✅ Acceso: ws://localhost:8080/ws

---

### 5️⃣ Terminal 5: Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
✅ Acceso: http://localhost:3000

---

## 🔑 Flujo de Autenticación

### 1. Registrarse
```bash
POST http://localhost:8001/api/v1/auth/register
{
  "correo": "user@example.com",
  "nombre": "Juan",
  "password": "pass123",
  "rol": "cliente"
}
```

### 2. Iniciar sesión
```bash
POST http://localhost:8001/api/v1/auth/login
{
  "correo": "user@example.com",
  "password": "pass123"
}

Response:
{
  "access_token": "eyJ0...",      ← 15 min
  "refresh_token": "eyJ0...",     ← 7 días
  "token_type": "bearer",
  "user": {...}
}
```

### 3. Usar en REST API
```bash
GET http://localhost:8000/api/v1/usuarios/me
Header: Authorization: Bearer eyJ0...
```

### 4. Renovar token (cuando expire)
```bash
POST http://localhost:8001/api/v1/auth/refresh
{
  "refresh_token": "eyJ0..."
}
```

### 5. Logout
```bash
POST http://localhost:8001/api/v1/auth/logout
Header: Authorization: Bearer eyJ0...
```

---

## 📁 Estructura

```
auth-service/
├── app/main.py              ← Aplicación
├── app/models/
│   ├── user.py              ← Usuarios
│   └── token.py             ← Tokens
├── app/routes/auth.py       ← Endpoints
├── app/services/
│   ├── token_service.py     ← JWT
│   ├── user_service.py      ← Usuarios
│   └── refresh_token_service.py
└── requirements.txt
```

---

## ⚙️ Configuración

**Variables importantes en `.env`:**

```env
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
RATE_LIMIT_LOGIN=5
```

⚠️ **IMPORTANTE:** La `SECRET_KEY` debe ser igual en **TODOS** los servicios

---

## 🔒 Seguridad

✅ Passwords: bcrypt (1200 iteraciones)  
✅ Tokens: HS256 firmados  
✅ Rate limiting: 5 intentos cada 15 min  
✅ Tokens revocables: logout inmediato  
✅ Access token corto: 15 minutos  
✅ Refresh token largo: 7 días  

---

## 📚 Documentación

| Archivo | Descripción |
|---------|-----------|
| [AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md](/AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md) | Resumen de implementación |
| [AUTHENTICATION_ARCHITECTURE.md](/AUTHENTICATION_ARCHITECTURE.md) | Arquitectura completa |
| [backend/api-rest/AUTH_INTEGRATION.md](/backend/api-rest/AUTH_INTEGRATION.md) | Cómo integrar en REST |
| [backend/graphql-nest/AUTH_INTEGRATION.md](/backend/graphql-nest/AUTH_INTEGRATION.md) | Cómo integrar en GraphQL |
| [backend/websocket-go/AUTH_INTEGRATION.md](/backend/websocket-go/AUTH_INTEGRATION.md) | Cómo integrar en WebSocket |
| [backend/api-rest/EXAMPLES_AUTH_USAGE.py](/backend/api-rest/EXAMPLES_AUTH_USAGE.py) | Ejemplos de código |

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Token inválido" | Verificar SECRET_KEY igual en todos los servicios |
| "Port already in use" | Cambiar puerto o matar proceso anterior |
| "Module not found" | Ejecutar `pip install -r requirements.txt` |
| "Auth Service no inicia" | Verificar `.env` está en `backend/auth-service/` |
| "Too many requests" | Esperar 15 min o cambiar IP |

---

## 💡 Validación Local

Los otros servicios NO consultan Auth Service en cada request:

```
Cliente → Auth Service (solo login/register)
            ↓
        Devuelve JWT
            ↓
Cliente → REST API
            ↓
    REST API valida JWT LOCALMENTE
    (sin llamadas HTTP al Auth Service)
```

**Beneficios:**
- ✅ Rápido: sin latencia de red
- ✅ Escalable: múltiples instancias
- ✅ Resiliente: si Auth Service cae, tokens siguen válidos

---

## 🎯 Endpoints Auth Service

```
POST   /api/v1/auth/register      Registrar
POST   /api/v1/auth/login         Login
POST   /api/v1/auth/logout        Logout
POST   /api/v1/auth/refresh       Renovar
GET    /api/v1/auth/me            Mi perfil
POST   /api/v1/auth/validate      Validar (interno)
GET    /health                    Health check
```

---

## ✨ Próximos pasos

- [ ] Actualizar endpoints protegidos en REST API
- [ ] Implementar JwtAuthGuard en GraphQL
- [ ] Implementar validación en WebSocket
- [ ] Migrar usuarios existentes
- [ ] Implementar 2FA
- [ ] Configurar HTTPS para producción

---

**¿Preguntas? Revisar documentación completa en los archivos .md**
