import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ReservasService } from './reservas.service';
import { ReservasResolver } from './reservas.resolver';
import { PeliculasModule } from '../peliculas/peliculas.module';
import { FuncionesModule } from '../funciones/funciones.module';

@Module({
  imports: [HttpModule, PeliculasModule, FuncionesModule, JwtModule.register({
    secret: process.env.SECRET_KEY || 'cinema_secret_key_super_segura_2025_cambiar_en_produccion',
    signOptions: { expiresIn: '15m' },
  })],
  providers: [ReservasService, ReservasResolver],
  exports: [ReservasService]
})
export class ReservasModule {}
