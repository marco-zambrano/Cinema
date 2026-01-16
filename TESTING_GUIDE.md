# 🧪 Testing - Microservicio de Autenticación

## Setup para Testing

### 1. Instalar herramientas (opcional, pero recomendado)

```bash
# Postman: https://www.postman.com/downloads/
# O instalar curl (normalmente ya viene en Windows)

# Para testing con websocat
npm install -g wscat
```

---

## 🧪 Test 1: Registro de Usuario

### Objetivo
Crear una nueva cuenta de usuario

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "nombre": "Juan Pérez",
    "password": "segura_123",
    "rol": "cliente"
  }'
```

### Expected Response (201 Created)
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "juan@example.com",
  "nombre": "Juan Pérez",
  "rol": "cliente",
  "activo": true,
  "fecha_creacion": "2025-01-16T10:30:00",
  "ultimo_login": null
}
```

### Validar
- ✅ Status code 201
- ✅ id_usuario es UUID válido
- ✅ rol es "cliente"
- ✅ activo es true

---

## 🧪 Test 2: Registro Duplicado (debe fallar)

### Objetivo
Verificar que no se permite registrar con mismo email

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "nombre": "Otro Juan",
    "password": "otra_pass",
    "rol": "cliente"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "detail": "El correo ya está registrado"
}
```

### Validar
- ✅ Status code 400
- ✅ Mensaje claramente indica que el correo existe

---

## 🧪 Test 3: Login Exitoso

### Objetivo
Obtener tokens JWT con credenciales válidas

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "password": "segura_123"
  }'
```

### Expected Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
    "correo": "juan@example.com",
    "nombre": "Juan Pérez",
    "rol": "cliente",
    "activo": true,
    "fecha_creacion": "2025-01-16T10:30:00",
    "ultimo_login": "2025-01-16T10:35:00"
  }
}
```

### Validar
- ✅ Status code 200
- ✅ access_token y refresh_token no están vacíos
- ✅ token_type es "bearer"
- ✅ user data incluida
- ✅ ultimo_login fue actualizado

### Guardar para próximos tests
```bash
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🧪 Test 4: Login Fallido - Contraseña Incorrecta

### Objetivo
Verificar que login falla con contraseña incorrecta

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "juan@example.com",
    "password": "contraseña_incorrecta"
  }'
```

### Expected Response (401 Unauthorized)
```json
{
  "detail": "Correo o contraseña incorrectos"
}
```

### Validar
- ✅ Status code 401
- ✅ Mensaje genérico (no revela si el correo existe)

---

## 🧪 Test 5: Obtener Perfil del Usuario

### Objetivo
Acceder a endpoint protegido con token válido

### Request
```bash
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Expected Response (200 OK)
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "juan@example.com",
  "nombre": "Juan Pérez",
  "rol": "cliente",
  "activo": true,
  "fecha_creacion": "2025-01-16T10:30:00",
  "ultimo_login": "2025-01-16T10:35:00"
}
```

### Validar
- ✅ Status code 200
- ✅ Datos coinciden con usuario

---

## 🧪 Test 6: Perfil sin Token (debe fallar)

### Objetivo
Verificar que endpoint protegido requiere token

### Request
```bash
curl -X GET http://localhost:8001/api/v1/auth/me
```

### Expected Response (401 Unauthorized)
```json
{
  "detail": "Token requerido"
}
```

### Validar
- ✅ Status code 401

---

## 🧪 Test 7: Perfil con Token Inválido (debe fallar)

### Objetivo
Verificar que token inválido es rechazado

### Request
```bash
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGci.invalid.token"
```

### Expected Response (401 Unauthorized)
```json
{
  "detail": "Token inválido o expirado"
}
```

### Validar
- ✅ Status code 401

---

## 🧪 Test 8: Renovar Token

### Objetivo
Usar refresh_token para obtener nuevo access_token

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }"
```

### Expected Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {...}
}
```

### Validar
- ✅ Status code 200
- ✅ Nuevo access_token diferente al anterior
- ✅ Nuevo refresh_token (rotación)
- ✅ token_type es "bearer"

---

## 🧪 Test 9: Logout (Revoke Tokens)

### Objetivo
Revocar tokens para logout inmediato

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Expected Response (200 OK)
```json
{
  "message": "Logout exitoso"
}
```

### Validar
- ✅ Status code 200

### Verificar: El token anterior ya no funciona
```bash
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected: 401 Unauthorized (token revocado)

---

## 🧪 Test 10: Rate Limiting

### Objetivo
Verificar rate limiting en login (5 intentos cada 15 min)

### Request (repetir 6 veces)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "correo": "test@example.com",
      "password": "wrong_password_'$i'"
    }'
  echo "Intento $i"
done
```

### Expected Response (6to intento - 429)
```json
{
  "detail": "Demasiados intentos de login. Intenta más tarde."
}
```

### Validar
- ✅ Primeros 5 intentos devuelven 401
- ✅ 6to intento devuelve 429 Too Many Requests

---

## 🧪 Test 11: Validación Local en REST API

### Objetivo
Verificar que REST API valida JWT localmente

### Request
```bash
curl -X GET http://localhost:8000/api/v1/usuarios/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Expected Response (200 OK - si endpoint existe)
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "juan@example.com",
  "rol": "cliente"
}
```

### Validar
- ✅ Status code 200
- ✅ REST API aceptó el token del Auth Service
- ✅ No hubo llamada HTTP al Auth Service (verificar en logs)

---

## 🧪 Test 12: Validación Interna (endpoint /validate)

### Objetivo
Verificar endpoint interno de validación

### Request
```bash
curl -X POST http://localhost:8001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$ACCESS_TOKEN\"
  }"
```

### Expected Response (200 OK)
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "correo": "juan@example.com",
  "rol": "cliente",
  "tipo": "access",
  "exp": 1705432800
}
```

### Validar
- ✅ Status code 200
- ✅ Devuelve datos decodificados del token

---

## 🧪 Test 13: Health Check

### Objetivo
Verificar que Auth Service está operativo

### Request
```bash
curl -X GET http://localhost:8001/health
```

### Expected Response (200 OK)
```json
{
  "status": "healthy",
  "service": "Auth Service"
}
```

### Validar
- ✅ Status code 200
- ✅ Status es "healthy"

---

## 🧪 Test 14: Swagger UI

### Objetivo
Verificar que documentación está disponible

### Acceso
```
http://localhost:8001/api/v1/docs
```

### Validar en Swagger
- ✅ Todos los 6 endpoints de auth están listados
- ✅ Schemas están correctamente documentados
- ✅ Se pueden ejecutar requests desde UI

---

## 🧪 Test 15: CORS

### Objetivo
Verificar que CORS está configurado

### Request (desde frontend en http://localhost:3000)
```javascript
fetch('http://localhost:8001/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Validar
- ✅ No hay error CORS
- ✅ Request se completa exitosamente

---

## 📊 Test Suite Completo

```bash
#!/bin/bash

echo "🚀 Iniciando test suite de autenticación..."

# Test 1: Registro
echo "✅ Test 1: Registro de usuario"
curl -s -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test'$RANDOM'@example.com",
    "nombre": "Test User",
    "password": "test_password",
    "rol": "cliente"
  }' | jq .

# Test 2: Login
echo "✅ Test 2: Login"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test'$RANDOM'@example.com",
    "password": "test_password"
  }')
echo $TOKEN_RESPONSE | jq .

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# Test 3: Perfil
echo "✅ Test 3: Obtener perfil"
curl -s -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Test 4: Health check
echo "✅ Test 4: Health check"
curl -s http://localhost:8001/health | jq .

echo "✨ Tests completados"
```

---

## 🔍 Verificar en Logs

Mientras ejecutas tests, verifica en los logs del Auth Service:

```
INFO: POST /api/v1/auth/register
INFO: 201 Created
INFO: Usuario creado exitosamente

INFO: POST /api/v1/auth/login
INFO: 200 OK
INFO: Token generado

INFO: GET /api/v1/auth/me
INFO: 200 OK
INFO: Token validado
```

---

## ✅ Checklist de Testing Completo

- [ ] Registro exitoso (201)
- [ ] Registro duplicado falla (400)
- [ ] Login exitoso (200)
- [ ] Login fallido falla (401)
- [ ] Perfil con token (200)
- [ ] Perfil sin token falla (401)
- [ ] Perfil con token inválido falla (401)
- [ ] Renovar token exitoso (200)
- [ ] Logout exitoso (200)
- [ ] Rate limiting funciona (429)
- [ ] REST API valida JWT (200)
- [ ] Validación interna funciona (200)
- [ ] Health check (200)
- [ ] Swagger UI disponible
- [ ] CORS configurado

---

## 🐛 Debugging

### Ver logs de Auth Service
```bash
# En terminal donde se ejecuta
# Los logs aparecen en tiempo real
```

### Ver contenido de JWT
```bash
# Usar jwt.io o:
python -c "
import base64
import json
token = 'eyJhbGci...'
payload = token.split('.')[1]
padding = '=' * (4 - len(payload) % 4)
decoded = base64.b64decode(payload + padding)
print(json.dumps(json.loads(decoded), indent=2))
"
```

### Verificar BD
```bash
# Si usas SQLite
sqlite3 auth.db

# Ver tablas
.tables

# Ver usuarios
SELECT * FROM usuario;
SELECT * FROM refresh_token;
SELECT * FROM revoked_token;
```

---

## 🎯 Próximos Tests

Una vez que Auth Service funciona perfectamente:

1. [ ] Testear integración con REST API completa
2. [ ] Testear integración con GraphQL
3. [ ] Testear integración con WebSocket
4. [ ] Tests de carga (múltiples usuarios simultáneos)
5. [ ] Tests de seguridad (SQL injection, XSS, etc)

---

**Todos los tests completados exitosamente = Auth Service listo para producción ✅**
