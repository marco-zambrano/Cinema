# 📖 Referencia Rápida - Microservicio de Autenticación

## 🚀 Inicio Rápido (Copiar y Pegar)

### Terminal 1: Auth Service
```bash
cd backend/auth-service
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Terminal 2: REST API
```bash
cd backend/api-rest
venv/Scripts/activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

---

## 🔑 Flujo de Autenticación

```
1. REGISTRO/LOGIN
   ↓
   POST http://localhost:8001/api/v1/auth/login
   {
     "correo": "user@example.com",
     "password": "pass123"
   }
   ↓
   Response:
   {
     "access_token": "eyJ0...",    ← Usar en requests
     "refresh_token": "eyJ0...",   ← Guardar seguro
     "user": {...}
   }
   
2. USAR TOKEN
   ↓
   GET http://localhost:8000/api/v1/usuarios/me
   Headers:
     Authorization: Bearer eyJ0...
   ↓
   REST API valida JWT LOCALMENTE
   (sin consultar Auth Service)
   
3. TOKEN EXPIRA (15 min)
   ↓
   POST http://localhost:8001/api/v1/auth/refresh
   {
     "refresh_token": "eyJ0..."
   }
   ↓
   Nuevo access_token
   
4. LOGOUT
   ↓
   POST http://localhost:8001/api/v1/auth/logout
   Headers:
     Authorization: Bearer eyJ0...
```

---

## 📋 Endpoints Auth Service

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Registrar usuario | ❌ |
| POST | `/api/v1/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/v1/auth/logout` | Cerrar sesión | ✅ |
| POST | `/api/v1/auth/refresh` | Renovar token | ❌ |
| GET | `/api/v1/auth/me` | Mi perfil | ✅ |
| POST | `/api/v1/auth/validate` | Validar token (interno) | ❌ |
| GET | `/health` | Health check | ❌ |

---

## 🔐 Variables de Entorno

### Auth Service (`.env`)
```env
DATABASE_URL=sqlite:///./auth.db
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
RATE_LIMIT_LOGIN=5
RATE_LIMIT_LOGIN_MINUTES=15
```

### REST API (`.env`)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
AUTH_SERVICE_URL=http://localhost:8001
```

**⚠️ IMPORTANTE:** `SECRET_KEY` debe ser igual en TODOS los servicios

---

## 💻 Ejemplos de Código

### Python (FastAPI - REST API)
```python
from fastapi import Depends
from app.utils.auth import get_current_user, TokenData

@router.get("/usuarios/me")
def get_profile(current_user: TokenData = Depends(get_current_user)):
    """El token se valida LOCALMENTE aquí"""
    return {
        "id": current_user.id_usuario,
        "correo": current_user.correo,
        "rol": current_user.rol
    }
```

### JavaScript (Frontend - React)
```javascript
// 1. Login
const response = await fetch('http://localhost:8001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correo: 'user@example.com',
    password: 'pass123'
  })
});

const { access_token, refresh_token } = await response.json();

// 2. Guardar tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// 3. Usar en requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
};

const res = await fetch('http://localhost:8000/api/v1/usuarios/me', { headers });

// 4. Si access_token expira (error 401)
// Usar refresh_token para obtener nuevo access_token
const refreshResponse = await fetch('http://localhost:8001/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refresh_token: localStorage.getItem('refresh_token')
  })
});

const { access_token: newToken } = await refreshResponse.json();
localStorage.setItem('access_token', newToken);
```

### TypeScript/Go (GraphQL/WebSocket)
Ver: `backend/graphql-nest/AUTH_INTEGRATION.md` y `backend/websocket-go/AUTH_INTEGRATION.md`

---

## 🧪 Testing Rápido

```bash
# 1. Registrar
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "nombre": "Test",
    "password": "pass123"
  }'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@example.com",
    "password": "pass123"
  }' | jq -r '.access_token')

# 3. Usar token
curl -X GET http://localhost:8000/api/v1/usuarios/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Logout
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Seguridad

| Aspecto | Implementado |
|--------|-------------|
| Passwords hasheados | ✅ bcrypt (1200 iteraciones) |
| Tokens firmados | ✅ HS256 |
| Access token corto | ✅ 15 minutos |
| Refresh token largo | ✅ 7 días |
| Rate limiting | ✅ 5 intentos/15 min |
| Tokens revocables | ✅ Blacklist |
| Email único | ✅ Constraint en BD |
| CORS | ✅ Configurado |
| Validación local | ✅ Sin HTTP en cada request |

---

## 📁 Estructura de Directorios

```
backend/
├── auth-service/              ← NUEVO: Microservicio de autenticación
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── utils/
│   └── requirements.txt
├── api-rest/                  ← ACTUALIZADO: Valida JWT localmente
│   ├── app/
│   │   └── utils/auth.py      ← NUEVO
│   ├── AUTH_INTEGRATION.md    ← NUEVO
│   └── EXAMPLES_AUTH_USAGE.py ← NUEVO
├── graphql-nest/
│   └── AUTH_INTEGRATION.md    ← NUEVO
└── websocket-go/
    └── AUTH_INTEGRATION.md    ← NUEVO
```

---

## 🐛 Troubleshooting

| Error | Solución |
|-------|----------|
| `Port already in use` | Cambiar puerto o `lsof -i :8001` + `kill -9 PID` |
| `Module not found` | `pip install -r requirements.txt` |
| `Token inválido` | Verificar `SECRET_KEY` igual en todos servicios |
| `CORS error` | Verificar Auth Service tiene CORS habilitado |
| `Auth Service no inicia` | Verificar `.env` existe en `backend/auth-service/` |
| `Too many requests` | Esperar 15 minutos o cambiar email/IP |

---

## 🔗 Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Auth Service | 8001 | http://localhost:8001 |
| REST API | 8000 | http://localhost:8000 |
| GraphQL | 3001 | http://localhost:3001 |
| WebSocket | 8080 | ws://localhost:8080 |
| Frontend | 3000 | http://localhost:3000 |

---

## 📚 Documentación Completa

| Documento | Contenido |
|-----------|----------|
| [QUICK_START_AUTH.md](QUICK_START_AUTH.md) | Inicio rápido (5 min) |
| [AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md](AUTH_SERVICE_IMPLEMENTATION_SUMMARY.md) | Resumen de la implementación |
| [AUTHENTICATION_ARCHITECTURE.md](AUTHENTICATION_ARCHITECTURE.md) | Arquitectura detallada |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | 15 tests completos |
| [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) | Resumen de cambios |
| [backend/api-rest/AUTH_INTEGRATION.md](backend/api-rest/AUTH_INTEGRATION.md) | Cómo integrar en REST |
| [backend/api-rest/EXAMPLES_AUTH_USAGE.py](backend/api-rest/EXAMPLES_AUTH_USAGE.py) | Ejemplos de código |

---

## ✅ Checklist de Setup

- [ ] Clonar repositorio
- [ ] Instalar Python 3.10+
- [ ] Instalar Node.js 18+
- [ ] Instalar Go 1.20+
- [ ] Instalar pnpm: `npm install -g pnpm`
- [ ] Crear venv en auth-service: `python -m venv venv`
- [ ] Crear venv en api-rest: `python -m venv venv`
- [ ] Instalar requerimientos: `pip install -r requirements.txt`
- [ ] Ejecutar Auth Service en puerto 8001
- [ ] Ejecutar REST API en puerto 8000
- [ ] Verificar http://localhost:8001/api/v1/docs
- [ ] Ejecutar prueba rápida de login

---

## 💡 Tips

**Tip 1:** Copiar `SECRET_KEY` de Auth Service al `.env` del REST API
```bash
grep SECRET_KEY backend/auth-service/.env >> backend/api-rest/.env
```

**Tip 2:** Ver el contenido de JWT
```bash
# Usar https://jwt.io o:
python -c "import jwt; token='...'; print(jwt.decode(token, options={'verify_signature': False}))"
```

**Tip 3:** Resetear BD
```bash
# Eliminar BD de Auth Service
rm backend/auth-service/auth.db
# Se recreará en próxima ejecución
```

**Tip 4:** Ver BD SQLite
```bash
sqlite3 backend/auth-service/auth.db ".tables"
sqlite3 backend/auth-service/auth.db "SELECT * FROM usuario;"
```

---

## 📞 Soporte Rápido

**¿No funciona?**
1. Verificar que los 3 servicios están corriendo
2. Verificar que los puertos son correctos
3. Verificar que `SECRET_KEY` es igual en todos
4. Revisar logs en terminal del Auth Service
5. Leer documentación completa

**¿Preguntas?**
- Revisar `TESTING_GUIDE.md` para ejemplos
- Revisar `EXAMPLES_AUTH_USAGE.py` para código
- Revisar `AUTHENTICATION_ARCHITECTURE.md` para conceptos

---

**¡Listo para desarrollar! 🚀**
