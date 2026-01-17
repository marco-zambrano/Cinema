import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { FacturasService } from './facturas.service';
import { FacturasResolver } from './facturas.resolver';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
  imports: [HttpModule, ReservasModule, JwtModule.register({
    secret: process.env.SECRET_KEY || 'cinema_secret_key_super_segura_2025_cambiar_en_produccion',
    signOptions: { expiresIn: '15m' },
  })],
  providers: [FacturasService, FacturasResolver],
  exports: [FacturasService]
})
export class FacturasModule {}
