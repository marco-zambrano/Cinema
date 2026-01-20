# GraphQL API - Autenticación JWT

## Configuración de Autenticación

El servicio GraphQL ahora valida tokens JWT **localmente** usando las mismas credenciales del Auth Service, sin necesidad de hacer llamadas HTTP en cada request.

## Endpoints Protegidos

Las siguientes queries requieren autenticación con token JWT:

- `usuarios` - Listar todos los usuarios
- `usuario` - Obtener un usuario específico
- `miPerfil` - Obtener el perfil del usuario autenticado
- `reservas` - Listar todas las reservas
- `reserva` - Obtener una reserva específica
- `reservasPorUsuario` - Obtener reservas del usuario autenticado
- `facturas` - Listar todas las facturas
- `factura` - Obtener una factura específica

## Endpoints Públicos

Las siguientes queries NO requieren autenticación:

- `peliculas` - Listar todas las películas
- `pelicula` - Obtener una película específica
- `salas` - Listar todas las salas
- `sala` - Obtener una sala específica
- `funciones` - Listar todas las funciones
- `funcion` - Obtener una función específica
- `asientos` - Listar todos los asientos
- `asiento` - Obtener un asiento específico

## Flujo de Autenticación

```
1. Cliente obtiene token del Auth Service (/api/v1/auth/login)
2. Cliente envía query GraphQL con:
   Headers:
     Authorization: Bearer {token}
3. GraphQL recibe request
4. GraphQL valida JWT LOCALMENTE (sin llamadas HTTP)
5. Si válido, ejecuta la query
6. Si inválido, retorna error 401
```

## Ejemplos de Uso

### 1. Obtener Token del Auth Service

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "usuario@example.com",
    "password": "micontraseña123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 2. Query Pública (Sin autenticación)

```graphql
query {
  peliculas {
    id
    titulo
    genero
    director
  }
}
```

**Request:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ peliculas { id titulo genero director } }"
  }'
```

### 3. Query Protegida (Con autenticación)

```graphql
query {
  miPerfil {
    id
    nombre
    correo
    rol
  }
}
```

**Request:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ miPerfil { id nombre correo rol } }"
  }'
```

### 4. Query - Mis Reservas

```graphql
query {
  reservasPorUsuario {
    id
    fecha_reserva
    estado
    pelicula {
      titulo
    }
  }
}
```

**Request:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ reservasPorUsuario { id fecha_reserva estado pelicula { titulo } } }"
  }'
```

### 5. Query - Facturas

```graphql
query {
  facturas {
    id
    monto_total
    estado
    fecha_emision
    reserva {
      id
      pelicula {
        titulo
      }
    }
  }
}
```

**Request:**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ facturas { id monto_total estado fecha_emision reserva { id pelicula { titulo } } } }"
  }'
```

## GraphQL Playground

Para usar el GraphQL Playground con autenticación:

1. Abre http://localhost:3001/graphql
2. En la sección "Headers" (abajo a la izquierda), agrega:
```json
{
  "Authorization": "Bearer {tu_token_aqui}"
}
```

3. Escribe tu query en el editor central
4. Presiona el botón de play para ejecutar

## Manejo de Errores

### Token No Proporcionado
```
Error: Token no proporcionado
```

### Token Inválido
```
Error: Token inválido o expirado
```

### Usuario No Autenticado
```
Error: Usuario no autenticado
```

## Configuración del Servidor

**Variables de entorno (.env):**
```env
PORT=3001
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
ALGORITHM=HS256
AUTH_SERVICE_URL=http://localhost:8001
DATABASE_URL=postgresql://postgres:password@localhost:5432/cinema
NODE_ENV=development
```

## Instalación de Dependencias

```bash
npm install
# o
yarn install
```

## Iniciar el Servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## Estructura del Token JWT

Los tokens incluyen:
- `sub` - Email del usuario (para identificar al usuario)
- `exp` - Tiempo de expiración
- Otros campos según la configuración del Auth Service

## Seguridad

✅ Validación de JWT sin llamadas HTTP  
✅ Tokens firmados con HS256  
✅ Protección de queries sensibles  
✅ Soporte para CORS  
✅ Manejo de errores de autenticación  

## Próximos Pasos

1. Implementar Mutations para crear/actualizar datos
2. Agregar más granularidad en autorización (roles)
3. Implementar refresh tokens
4. Agregar rate limiting
