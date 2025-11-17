# 🗄️ Información de Base de Datos para GraphQL

## Conexión a Supabase
```env
DB_HOST=db.qeeexysgxyxmocvspguo.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[CONTRASEÑA_AQUÍ]
```

## String de conexión
```
postgresql://postgres:[PASSWORD]@db.qeeexysgxyxmocvspguo.supabase.co:5432/postgres
```

## Tablas disponibles

- `usuario` - Usuarios del sistema
- `pelicula` - Catálogo de películas
- `sala` - Salas de cine
- `funcion` - Funciones/horarios de películas
- `asiento` - Asientos de cada sala
- `reserva` - Reservas de usuarios
- `reserva_asiento` - Relación reserva-asiento
- `factura` - Facturas de reservas
- `incidencia` - Incidencias reportadas

## Reportes sugeridos para GraphQL

1. **Películas más vistas** (JOIN entre reserva, funcion, pelicula)
2. **Ingresos por periodo** (Agregación de facturas)
3. **Ocupación de salas** (Análisis de asientos ocupados vs disponibles)
4. **Funciones con más ventas** (JOIN y COUNT de reservas)
5. **Estadísticas de usuarios** (Reservas por usuario, gasto promedio)
6. **Métodos de pago más usados** (Agregación de facturas)

## Notas importantes

- **GraphQL SOLO debe hacer consultas (SELECT)** - No modificar datos
- **REST API maneja todo el CRUD** - Crear, actualizar, eliminar
- Todos los IDs son UUID v4

## Ejecución de cada módulo
- REST: "cd backend"; "cd app"; py -m venv venv" (en caso de no tener la carpeta venv); pip install -r requirements.txt"; "uvicorn app.main:app --reload"
- Graphql: "cd backend"; "cd graphql-nest"; "npm install"; "npm run start:dev"
- WebSocket: "go run main.go"
- Frontend: "npm install -g pnpm" (en caso de no tener pnpm); "cd frontend"; "pnpm install"; "pnpm run dev"