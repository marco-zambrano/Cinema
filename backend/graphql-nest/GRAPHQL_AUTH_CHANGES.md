# GraphQL Auth Integration - Cambios Realizados

## Resumen

Se implementó la integración de autenticación JWT con el Auth Service en el backend GraphQL de NestJS. El servidor ahora valida tokens JWT **localmente** sin hacer llamadas HTTP en cada request.

## Archivos Creados

### 1. `src/guards/jwt-auth.guard.ts`
- Guard de autenticación para proteger queries
- Valida JWT localmente usando JwtService
- Extrae el usuario desde el token y lo pasa al contexto GraphQL
- Maneja errores de autenticación apropiadamente

### 2. `.env`
- Configuración de puerto (3001)
- SECRET_KEY: Mismo que Auth Service para validar tokens
- ALGORITHM: HS256
- AUTH_SERVICE_URL: URL del servicio de autenticación
- DATABASE_URL: Conexión a PostgreSQL
- NODE_ENV: environment

### 3. `GRAPHQL_AUTH_SETUP.md`
- Documentación completa de autenticación
- Ejemplos de queries públicas y protegidas
- Ejemplos de requests con curl
- Guía de GraphQL Playground
- Estructura del token JWT

## Archivos Modificados

### 1. `src/app.module.ts`
**Cambios:**
- Agregado `ConfigModule` para cargar variables de entorno
- Agregado `JwtModule` con configuración de SECRET_KEY
- Actualizado `GraphQLModule` con contexto que extrae el token del header Authorization
- Importados los nuevos módulos

### 2. `src/usuarios/usuarios.resolver.ts`
**Cambios:**
- Agregado `@UseGuards(JwtAuthGuard)` a todas las queries
- Agregada nueva query `miPerfil` que retorna el perfil del usuario autenticado
- Actualizado el contexto para acceder al usuario desde el token

### 3. `src/reservas/reservas.resolver.ts`
**Cambios:**
- Agregado `@UseGuards(JwtAuthGuard)` a todas las queries
- Actualizada query `reservasPorUsuario` para usar el usuario del contexto si no se proporciona id_usuario
- Agregada capacidad de obtener reservas del usuario autenticado

### 4. `src/facturas/facturas.resolver.ts`
**Cambios:**
- Agregado `@UseGuards(JwtAuthGuard)` a todas las queries
- Importado el guard de autenticación

### 5. `src/main.ts`
**Cambios:**
- Limpieza de código
- Uso de variable PORT desde .env

### 6. `package.json`
**Cambios:**
- Agregada dependencia `@nestjs/config@^3.1.1`
- Agregada dependencia `@nestjs/jwt@^12.0.1`

## Queries Públicas (Sin autenticación requerida)

```
- peliculas
- pelicula (por id)
- salas
- sala (por id)
- funciones
- funcion (por id)
- asientos
- asiento (por id)
```

## Queries Protegidas (Requieren token JWT)

```
- usuarios (listar todos)
- usuario (por id)
- miPerfil (perfil del usuario autenticado)
- reservas (listar todas)
- reserva (por id)
- reservasPorUsuario (del usuario autenticado)
- facturas (listar todas)
- factura (por id)
```

## Flujo de Autenticación

1. **Obtener Token:**
   - Cliente hace POST a `http://localhost:8001/api/v1/auth/login`
   - Envía correo y contraseña
   - Recibe JWT token

2. **Usar Token en GraphQL:**
   - Cliente envía query con header: `Authorization: Bearer {token}`
   - GraphQL extrae el token del header
   - GraphQL valida JWT localmente
   - Si válido, ejecuta la query y pasa `user` al contexto
   - Si inválido, retorna error 401

3. **Acceso a Usuario en Resolvers:**
   - Dentro de un query protegido, se puede acceder a `@Context() context`
   - El usuario está en `context.user`
   - El email del usuario está en `context.user.sub`

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## Validación de Configuración

✅ ConfigModule cargando variables de entorno
✅ JwtModule registrado con SECRET_KEY del Auth Service
✅ GraphQLModule extrayendo token del header Authorization
✅ Guards protegiendo queries sensibles
✅ Contexto disponible en resolvers
✅ Manejo de errores de autenticación

## Pruebas Recomendadas

1. **Query pública sin token:**
   ```graphql
   query { peliculas { id titulo } }
   ```

2. **Query protegida sin token:**
   - Debe retornar: `Error: Token no proporcionado`

3. **Query protegida con token inválido:**
   - Debe retornar: `Error: Token inválido o expirado`

4. **Query protegida con token válido:**
   - Debe retornar los datos correctamente

5. **Query miPerfil con token válido:**
   - Debe retornar el perfil del usuario autenticado

## Próximos Pasos (Opcional)

- [ ] Implementar Mutations para crear/actualizar datos
- [ ] Agregar granularidad de autorización por roles
- [ ] Implementar refresh tokens
- [ ] Agregar rate limiting
- [ ] Implementar logging de autenticación
- [ ] Agregar validación de scopes

## Documentación Adicional

Ver archivo `GRAPHQL_AUTH_SETUP.md` para:
- Ejemplos completos de queries
- Ejemplos de requests con curl
- Guía de GraphQL Playground
- Estructura del token JWT
- Manejo de errores
