import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { AsientosModule } from './asientos/asientos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PeliculasModule } from './peliculas/peliculas.module';
import { SalasModule } from './salas/salas.module';
import { FuncionesModule } from './funciones/funciones.module';
import { ReservasModule } from './reservas/reservas.module';
import { ReservaAsientoModule } from './reserva-asiento/reserva-asiento.module';
import { FacturasModule } from './facturas/facturas.module';
import { HttpModule } from 'src/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.SECRET_KEY || 'cinema_secret_key_super_segura_2025_cambiar_en_produccion',
      signOptions: { expiresIn: '15m' },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => {
        // Extraer token del header Authorization
        const token = req?.headers?.authorization?.split(' ')[1];
        return { token, req };
      },
    }),
    HttpModule,
    AsientosModule,
    UsuariosModule,
    PeliculasModule,
    SalasModule,
    FuncionesModule,
    ReservasModule,
    ReservaAsientoModule,
    FacturasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
