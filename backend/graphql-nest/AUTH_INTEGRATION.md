# GraphQL Integration with Auth Service

## Cambios necesarios en GraphQL Service

El servicio GraphQL debe ser actualizado para validar tokens JWT del Auth Service **localmente**, sin hacer llamadas HTTP en cada request.

## Implementación

### 1. Actualizar configuración (main.ts)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '15m' },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      context: ({ req }) => {
        // Extraer token del header
        const token = req.headers.authorization?.split(' ')[1];
        return { token, req };
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Crear Guard de autenticación (jwt-auth.guard.ts)

```typescript
import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const gqlContext = GqlExecutionContext.create(context);
    const { token } = gqlContext.getContext();

    if (!token) {
      throw new Error('Token no proporcionado');
    }

    try {
      const decoded = this.jwtService.verify(token);
      gqlContext.getContext().user = decoded;
      return true;
    } catch (err) {
      throw new Error('Token inválido o expirado');
    }
  }
}
```

### 3. Usar en resolvers

```typescript
import { Resolver, Query, Context, UseGuards } from '@nestjs/graphql';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Resolver()
export class PeliculasResolver {
  constructor(private peliculasService: PeliculasService) {}

  // Query pública
  @Query()
  peliculas() {
    return this.peliculasService.findAll();
  }

  // Query protegida
  @Query()
  @UseGuards(JwtAuthGuard)
  misPeliculas(@Context() ctx) {
    const userId = ctx.user.id_usuario;
    return this.peliculasService.findByUser(userId);
  }
}
```

### 4. Variables de entorno (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/cinema

# JWT (mismo que Auth Service)
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion
ALGORITHM=HS256

# Auth Service (para consultas específicas si es necesario)
AUTH_SERVICE_URL=http://localhost:8001
```

## Ventajas

✅ Valida tokens sin hacer llamadas HTTP en cada request  
✅ Los tokens del Auth Service funcionan directamente  
✅ Menor latencia en queries GraphQL  
✅ Mejor scalabilidad  

## Flujo de autenticación en GraphQL

```
1. Cliente obtiene token del Auth Service
2. Cliente envía query GraphQL con:
   Headers:
     Authorization: Bearer {token}
3. GraphQL recibe request
4. GraphQL valida JWT LOCALMENTE
5. Si válido, ejecuta la query
6. Si inválido, retorna error 401
```

## Queries ejemplo

### Query pública
```graphql
query {
  peliculas {
    id
    titulo
    genero
  }
}
```

### Query protegida
```graphql
query {
  miPerfil {
    id
    correo
    rol
  }
}
```

Header requerido:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing

```bash
# Obtener token
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"user@example.com","password":"pass123"}'

# Usar en GraphQL
curl -X POST http://localhost:3001/graphql \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ peliculas { id titulo } }"}'
```
