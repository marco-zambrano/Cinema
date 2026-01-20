# Configuración de n8n - Event Bus

Este documento explica cómo configurar y usar n8n como Event Bus central para el proyecto CINE.

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker Desktop instalado y ejecutándose
- Docker Compose (incluido en Docker Desktop)

### Levantar n8n

Desde la raíz del proyecto, ejecuta:

```bash
docker-compose up -d
```

Esto iniciará n8n en segundo plano. Para ver los logs:

```bash
docker-compose logs -f n8n
```

### Acceder a n8n

Una vez iniciado, accede a:
- **URL**: http://localhost:5678
- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción usando las variables de entorno en `docker-compose.yml`.

## 📋 Workflows Requeridos

Según el Pilar 4, necesitas implementar los siguientes workflows:

### 1. Payment Handler
**Ruta**: Recibe webhook de pasarela de pago

**Flujo**:
1. Recibe webhook de pasarela de pago (Stripe/MercadoPago/Mock)
2. Valida payload
3. Activa servicio/reserva
4. Notifica via WebSocket
5. Envía email de confirmación
6. Dispara webhook al grupo partner

**Configuración**:
- **Webhook Trigger**: POST endpoint en n8n
- **Validación**: Verificar estructura del payload
- **Llamadas a API**: 
  - `POST http://localhost:8000/api/v1/reservas` - Activar reserva
  - `POST ws://localhost:8080/ws` - Notificar por WebSocket 
  - `POST http://localhost:8000/api/v1/webhooks/send` - Enviar a partner

### 2. Partner Handler
**Ruta**: Recibe webhook de grupo partner

**Flujo**:
1. Recibe webhook de grupo partner
2. Verifica firma HMAC
3. Procesa según tipo de evento
4. Ejecuta acción de negocio
5. Responde ACK

**Configuración**:
- **Webhook Trigger**: POST endpoint en n8n
- **Validación HMAC**: Usar función para verificar firma
- **Endpoint Partner**: `/webhooks/receive` en tu REST API

### 3. MCP Input Handler (Telegram/Email)
**Ruta**: Recibe mensaje de Telegram/Email

**Flujo**:
1. Recibe mensaje de Telegram/Email
2. Extrae contenido y adjuntos
3. Envía a AI Orchestrator (MCP Server)
4. Responde por el mismo canal

**Configuración**:
- **Telegram Trigger** o **Email Trigger**: Configurar bot/email
- **Procesamiento**: Extraer texto e imágenes/PDFs
- **Llamada MCP**: `POST http://localhost:[MCP_PORT]/chat` (verificar puerto del MCP)

### 4. Scheduled Tasks
**Ruta**: Cron job programado

**Tareas sugeridas**:
- Reporte diario de ventas
- Limpieza de datos antiguos
- Recordatorios de funciones
- Health checks de servicios

**Configuración**:
- **Cron Trigger**: Configurar frecuencia (diario, semanal, etc.)
- **Acciones**: Llamadas a API o generación de reportes

## 🔧 Variables de Entorno Configuradas

El `docker-compose.yml` ya incluye estas variables para facilitar las conexiones:

- `API_REST_URL`: http://host.docker.internal:8000/api/v1
- `API_AUTH_URL`: http://host.docker.internal:8001/api/v1
- `WEBSOCKET_URL`: ws://host.docker.internal:8080/ws
- `GRAPHQL_URL`: http://host.docker.internal:3001/graphql

Usa estas variables en tus workflows usando `{{ $env.API_REST_URL }}` en n8n.

## 📁 Estructura de Directorios

```
cinema/
├── docker-compose.yml      # Configuración de Docker
├── n8n-workflows/          # Workflows exportados (backup)
└── N8N_SETUP.md           # Esta documentación
```

## 🛠️ Comandos Útiles

### Detener n8n
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ borra datos)
```bash
docker-compose down -v
```

### Reiniciar n8n
```bash
docker-compose restart n8n
```

### Ver estado
```bash
docker-compose ps
```

### Acceder a los logs
```bash
docker-compose logs -f n8n
```

## 🔐 Seguridad

### Cambiar credenciales de n8n

Edita `docker-compose.yml` y modifica:
```yaml
- N8N_BASIC_AUTH_USER=tu_usuario
- N8N_BASIC_AUTH_PASSWORD=tu_contraseña_segura
```

Luego reinicia:
```bash
docker-compose down
docker-compose up -d
```

## 📊 Persistencia de Datos

Los datos de n8n se guardan en un volumen Docker llamado `n8n_data`. Esto incluye:
- Workflows creados
- Configuraciones
- Ejecuciones (si están habilitadas)
- Credenciales

Para hacer backup, exporta los workflows desde la UI de n8n a `n8n-workflows/`.

## 🔗 Endpoints de Referencia

### Tu REST API
- Base: `http://localhost:8000/api/v1`
- Webhooks: `POST /webhooks/receive`
- Payments: `POST /payments`
- Reservas: `POST /reservas`

### Auth Service
- Base: `http://localhost:8001/api/v1`
- Validate: `GET /auth/validate` (interno)

### GraphQL
- Endpoint: `http://localhost:3001/graphql`

### WebSocket
- Endpoint: `ws://localhost:8080/ws`

## 📝 Notas

- `host.docker.internal` permite que el contenedor de n8n acceda a servicios en tu máquina local
- En Linux, puede que necesites usar `172.17.0.1` en lugar de `host.docker.internal`
- Los webhooks de n8n son accesibles públicamente por defecto. En producción, configura autenticación adicional
- Considera usar ngrok para desarrollo si necesitas exponer webhooks públicamente

## 🆘 Troubleshooting

### n8n no inicia
- Verifica que Docker Desktop esté ejecutándose
- Revisa los logs: `docker-compose logs n8n`
- Verifica que el puerto 5678 no esté en uso

### No puedo conectarme a mis APIs desde n8n
- Verifica que tus servicios estén ejecutándose
- En Linux, puede necesitar usar `172.17.0.1` en lugar de `host.docker.internal`
- Verifica las URLs en las variables de entorno

### Los webhooks no funcionan
- Verifica que n8n esté accesible desde internet (usa ngrok para desarrollo)
- Revisa los logs del workflow en n8n
- Verifica que el endpoint webhook esté activo en n8n
