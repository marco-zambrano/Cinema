import { Resolver, Query, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Usuario } from './entities/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Resolver(() => Usuario)
export class UsuariosResolver {
  constructor(private httpServices: UsuariosService) {}

  @Query(() => [Usuario], { name: 'usuarios' })
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.httpServices.findAll();
  }

  @Query(() => Usuario, { name: 'usuario' })
  @UseGuards(JwtAuthGuard)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.httpServices.findOne(id);
  }

  @Query(() => Usuario, { name: 'miPerfil' })
  @UseGuards(JwtAuthGuard)
  async miPerfil(@Context() context: any) {
    const user = context.user;
    if (!user || !user.sub) {
      throw new Error('Usuario no autenticado');
    }
    return this.httpServices.findByEmail(user.sub);
  }
}
