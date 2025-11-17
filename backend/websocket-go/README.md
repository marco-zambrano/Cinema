# Servidor WebSocket en Go

Servidor WebSocket que proporciona actualizaciones en tiempo real de las estadísticas del panel de administración.

## Características

- Actualización en tiempo real cada 5 segundos
- Conexión a PostgreSQL para obtener estadísticas
- Broadcasting a todos los clientes conectados
- Manejo de reconexión automática en el frontend

## Estadísticas proporcionadas

1. **Número de películas activas** - Total de películas en el sistema
2. **Número de reservas activas** - Reservas no canceladas
3. **Número de clientes activos** - Usuarios con rol 'cliente'
4. **Número de administradores activos** - Usuarios con rol 'admin'
5. **Número de funciones activas** - Funciones con fecha/hora >= ahora
6. **Número de salas disponibles** - Salas con estado 'disponible' o NULL

## Requisitos

- Go 1.25.2 o superior
- PostgreSQL con acceso a la base de datos
- Variable de entorno `DATABASE_URL` configurada

## Instalación

1. Instalar dependencias de Go:
```bash
cd backend/websocket-go
go mod download
```

2. Configurar la variable de entorno `DATABASE_URL`:
```bash
# En Windows (PowerShell)
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.qeeexysgxyxmocvspguo.supabase.co:5432/postgres"

# En Linux/Mac
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.qeeexysgxyxmocvspguo.supabase.co:5432/postgres"
```

3. (Opcional) Configurar el puerto:
```bash
# Por defecto usa el puerto 8080, pero puedes cambiarlo:
$env:PORT="8080"  # Windows
export PORT="8080"  # Linux/Mac
```

## Ejecución

```bash
cd backend/websocket-go
go run main.go
```

El servidor se iniciará en `ws://localhost:8080/ws`

## Endpoints

- `ws://localhost:8080/ws` - Endpoint WebSocket para recibir actualizaciones en tiempo real

## Estructura del mensaje

El servidor envía mensajes JSON con el siguiente formato:

```json
{
  "totalMovies": 10,
  "totalReservations": 25,
  "totalCustomers": 50,
  "totalAdmins": 3,
  "totalFunctions": 15,
  "totalHalls": 5
}
```

## Configuración del Frontend

El frontend está configurado para conectarse automáticamente al WebSocket. Por defecto usa:
- URL: `ws://localhost:8080/ws`
- Puedes cambiarlo configurando la variable de entorno `NEXT_PUBLIC_WEBSOCKET_URL` en el frontend

## Notas

- El servidor actualiza las estadísticas cada 5 segundos automáticamente
- Cuando un nuevo cliente se conecta, recibe las estadísticas inmediatamente
- Si un cliente se desconecta, el servidor lo elimina automáticamente de la lista de clientes

## Ejecución de cada módulo
- REST: "cd backend"; "cd app"; py -m venv venv" (en caso de no tener la carpeta venv); pip install -r requirements.txt"; "uvicorn app.main:app --reload"
- Graphql: "cd backend"; "cd graphql-nest"; "npm install"; "npm run start:dev"
- WebSocket: "go run main.go"
- Frontend: "npm install -g pnpm" (en caso de no tener pnpm); "cd frontend"; "pnpm install"; "pnpm run dev"