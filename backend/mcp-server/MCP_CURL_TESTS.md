# Comandos curl para Probar el Servidor MCP

Este documento contiene todos los comandos curl necesarios para probar el servidor MCP y sus herramientas usando Postman o la terminal.

## 📋 Información General

- **URL Base**: `http://localhost:3004`
- **Protocolo**: JSON-RPC 2.0
- **Endpoint Principal**: `POST /mcp`

---

## 🔍 1. Health Check (Verificar que el servidor está corriendo)

```bash
curl -X GET http://localhost:3004/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T...",
  "tools": 3
}
```

---

## 📦 2. Listar Tools Disponibles (Método REST)

```bash
curl -X GET http://localhost:3004/tools
```

**Respuesta esperada**:
```json
{
  "tools": [
    {
      "name": "buscar_pelicula",
      "description": "...",
      "inputSchema": {...}
    },
    ...
  ]
}
```

---

## 🔧 3. Listar Tools Disponibles (Método JSON-RPC)

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**Respuesta esperada**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "buscar_pelicula",
        "description": "Busca películas por título...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "titulo": {
              "type": "string",
              "description": "..."
            }
          },
          "required": []
        }
      },
      {
        "name": "validar_disponibilidad_sala",
        "description": "Valida la disponibilidad de asientos...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "functionId": {
              "type": "string",
              "description": "..."
            }
          },
          "required": ["functionId"]
        }
      },
      {
        "name": "crear_reserva",
        "description": "Crea una nueva reserva...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "funcionId": {"type": "string"},
            "usuarioId": {"type": "string"},
            "usuarioNombre": {"type": "string"},
            "email": {"type": "string"},
            "cantidadAsientos": {"type": "integer"},
            "total": {"type": "number"}
          },
          "required": ["funcionId", "usuarioId", "usuarioNombre", "email"]
        }
      }
    ]
  },
  "id": 1
}
```

---

## 🎬 4. Tool: buscar_pelicula (Sin parámetros - Todas las películas)

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "buscar_pelicula",
      "arguments": {}
    },
    "id": 2
  }'
```

**Respuesta esperada**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Películas encontradas:\n- Inception (Sci-Fi) - 148 min - ID: ...\n- ..."
      }
    ]
  },
  "id": 2
}
```

---

## 🎬 5. Tool: buscar_pelicula (Con título específico)

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "buscar_pelicula",
      "arguments": {
        "titulo": "Inception"
      }
    },
    "id": 3
  }'
```

**Respuesta esperada**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Películas encontradas:\n- Inception (Sci-Fi) - 148 min - ID: 1"
      }
    ]
  },
  "id": 3
}
```

**Si no encuentra películas**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "No se encontraron películas con el título \"Película Inexistente\""
      }
    ]
  },
  "id": 3
}
```

---

## 🎟️ 6. Tool: validar_disponibilidad_sala

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "validar_disponibilidad_sala",
      "arguments": {
        "functionId": "FUNC-123"
      }
    },
    "id": 4
  }'
```

**Respuesta exitosa (hay disponibilidad)**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "La sala <uuid-sala> tiene 45 asientos disponibles para la función FUNC-123."
      }
    ]
  },
  "id": 4
}
```

**Respuesta si NO hay disponibilidad**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "No hay asientos disponibles para la función FUNC-123."
      }
    ],
    "isError": true
  },
  "id": 4
}
```

**Error por parámetro faltante**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Tool name is required"
  },
  "id": 4
}
```

---

## ✅ 7. Tool: crear_reserva (Reserva completa)

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "crear_reserva",
      "arguments": {
        "funcionId": "FUNC-123",
        "usuarioId": "USER-456",
        "usuarioNombre": "Juan Pérez",
        "email": "juan.perez@example.com",
        "cantidadAsientos": 2,
        "total": 25.50
      }
    },
    "id": 5
  }'
```

**Respuesta exitosa**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✓ Reserva creada exitosamente!\nID Reserva: RES-123456\nFunción: FUNC-123\nUsuario: Juan Pérez (juan.perez@example.com)\nFecha: 20/1/2026, 13:30:00"
      }
    ]
  },
  "id": 5
}
```

**Error por parámetros faltantes**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: Todos los parámetros son requeridos (funcionId, usuarioId, usuarioNombre, email)"
      }
    ],
    "isError": true
  },
  "id": 5
}
```

**Error por email inválido**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: El formato del email no es válido"
      }
    ],
    "isError": true
  },
  "id": 5
}
```

---

## 🔧 8. Tool: crear_reserva (Reserva mínima - solo campos requeridos)

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "crear_reserva",
      "arguments": {
        "funcionId": "FUNC-123",
        "usuarioId": "USER-456",
        "usuarioNombre": "María García",
        "email": "maria.garcia@example.com"
      }
    },
    "id": 6
  }'
```

---

## ⚠️ 9. Errores Comunes

### Error: Tool no encontrada

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "tool_inexistente",
      "arguments": {}
    },
    "id": 7
  }'
```

**Respuesta**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Tool \"tool_inexistente\" not found"
  },
  "id": 7
}
```

---

### Error: Método no encontrado

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "metodo_inexistente",
    "id": 8
  }'
```

**Respuesta**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method \"metodo_inexistente\" not found"
  },
  "id": 8
}
```

---

### Error: Versión JSON-RPC inválida

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "1.0",
    "method": "tools/list",
    "id": 9
  }'
```

**Respuesta**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid JSON-RPC version"
  },
  "id": 9
}
```

---

### Error: Falta el método

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 10
  }'
```

**Respuesta**:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Method is required"
  },
  "id": 10
}
```

---

## 📝 Notas Importantes

### ⚠️ Tool no registrada: crear_reporte

He notado que existe el archivo `crear-reporte.tool.ts` pero **NO está registrada** en `registry.ts`. Para usarla, necesitas agregarla al registry:

```typescript
// En registry.ts, agregar:
import { 
  CrearReporteTool, 
  exCrearReporteTool 
} from '../tools/crear-reporte.tool';

// Y en el constructor:
this.registerTool(CrearReporteTool, exCrearReporteTool);
```

Una vez registrada, el curl sería:

```bash
curl -X POST http://localhost:3004/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "crear_reporte",
      "arguments": {
        "fechaInicio": "2026-01-01",
        "fechaFin": "2026-01-31",
        "tipo_reporte": "problemas con reservar peliculas",
        "descripcion_reporte": "Reporte mensual de enero",
        "userId": "USER-123"
      }
    },
    "id": 11
  }'
```

---

## 🧪 Testing en Postman

### Configuración de Postman

1. **Crear una nueva colección**: "MCP Server Tests"

2. **Configurar variables de entorno**:
   - `base_url`: `http://localhost:3004`
   - `jsonrpc`: `2.0`

3. **Headers comunes**:
   - `Content-Type`: `application/json`

4. **Cuerpo de las peticiones**:
   - Seleccionar `raw` → `JSON`
   - Usar los ejemplos JSON de arriba

### Colección Recomendada

1. **Health Check** (GET)
2. **List Tools REST** (GET)
3. **List Tools JSON-RPC** (POST)
4. **Buscar Película - Sin filtro** (POST)
5. **Buscar Película - Con filtro** (POST)
6. **Validar Disponibilidad** (POST)
7. **Crear Reserva - Completa** (POST)
8. **Crear Reserva - Mínima** (POST)
9. **Error - Tool inexistente** (POST)
10. **Error - Método inexistente** (POST)

---

## 🔗 Dependencias

Estos curls asumen que:
- El servidor MCP está corriendo en `http://localhost:3004`
- El backend REST API está corriendo en `http://localhost:8000/api/v1`
- Los servicios están accesibles y funcionando correctamente

Para verificar que todo está corriendo:
```bash
# MCP Server
curl http://localhost:3004/health

# REST API
curl http://localhost:8000/api/v1/peliculas
```

---

## 📚 Referencias

- **Protocolo JSON-RPC 2.0**: https://www.jsonrpc.org/specification
- **MCP Protocol**: Model Context Protocol
- **Puerto MCP**: `3004` (configurable via `PORT` env var)
