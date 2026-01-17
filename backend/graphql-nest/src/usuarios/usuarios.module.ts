import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { UsuariosService } from './usuarios.service';
import { UsuariosResolver } from './usuarios.resolver';

@Module({
  imports: [HttpModule, JwtModule.register({
    secret: process.env.SECRET_KEY || 'cinema_secret_key_super_segura_2025_cambiar_en_produccion',
    signOptions: { expiresIn: '15m' },
  })],
  providers: [UsuariosService, UsuariosResolver],
  exports: [UsuariosService]
})
export class UsuariosModule {}

