import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { FuncionesService } from './funciones.service';
import { Funciones } from './entities/funcione.entity';
import { PeliculasService } from '../peliculas/peliculas.service';
import { SalasService } from '../salas/salas.service';
import { Pelicula } from '../peliculas/entities/pelicula.entity';
import { Sala } from '../salas/entities/sala.entity';

@Resolver(() => Funciones)
export class FuncionesResolver {
  constructor(
    private readonly funcionesService: FuncionesService,
    private readonly peliculasService: PeliculasService,
    private readonly salasService: SalasService,
  ) {}

  @Query(() => [Funciones], { name: 'funciones' })
  async findAll() {
    try {
      return await this.funcionesService.findAll();
    } catch (error) {
      console.error('Error en FuncionesResolver.findAll:', error);
      throw error;
    }
  }

  @Query(() => Funciones, { name: 'funcion' })
  async findOne(@Args('id', { type: () => String }) id: string) {
    try {
      return await this.funcionesService.findOne(id);
    } catch (error) {
      console.error(`Error en FuncionesResolver.findOne(${id}):`, error);
      throw error;
    }
  }

  // ⭐ NUEVA QUERY - ESTE ES TU FIX
  @Query(() => [Funciones], { name: 'funcionesPorPelicula' })
  async findByPelicula(
    @Args('id_pelicula', { type: () => String }) id_pelicula: string
  ) {
    try {
      return await this.funcionesService.findByPelicula(id_pelicula);
    } catch (error) {
      console.error(`Error en FuncionesResolver.findByPelicula(${id_pelicula}):`, error);
      throw error;
    }
  }

  @ResolveField(() => [Pelicula], { name: 'peliculas' })
  async resolvePeliculas(@Parent() funcion: Funciones): Promise<Pelicula[]> {
    if (!funcion.id_pelicula) {
      return [];
    }
    try {
      const pelicula = await this.peliculasService.findOne(funcion.id_pelicula);
      return pelicula ? [pelicula] : [];
    } catch (error) {
      console.error(`Error al resolver pelicula para funcion ${funcion.id_funcion}:`, error);
      return [];
    }
  }

  @ResolveField(() => [Sala], { name: 'salas' })
  async resolveSalas(@Parent() funcion: Funciones): Promise<Sala[]> {
    if (!funcion.id_sala) {
      return [];
    }
    try {
      const sala = await this.salasService.findOne(funcion.id_sala);
      return sala ? [sala] : [];
    } catch (error) {
      console.error(`Error al resolver sala para funcion ${funcion.id_funcion}:`, error);
      return [];
    }
  }
}