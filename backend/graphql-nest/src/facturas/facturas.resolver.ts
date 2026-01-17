import { Resolver, Query, Args, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { Factura } from './entities/factura.entity';
import { ReservasService } from '../reservas/reservas.service';
import { Reserva } from '../reservas/entities/reserva.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Resolver(() => Factura)
export class FacturasResolver {
  constructor(
    private readonly facturasService: FacturasService,
    private readonly reservasService: ReservasService,
  ) {}

  @Query(() => [Factura], { name: 'facturas' })
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {
      return await this.facturasService.findAll();
    } catch (error) {
      console.error('Error en FacturasResolver.findAll:', error);
      throw error;
    }
  }

  @Query(() => Factura, { name: 'factura' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Args('id', { type: () => String }) id: string) {
    try {
      return await this.facturasService.findOne(id);
    } catch (error) {
      console.error(`Error en FacturasResolver.findOne(${id}):`, error);
      throw error;
    }
  }

  @ResolveField(() => Reserva, { name: 'reserva', nullable: true })
  async resolveReserva(@Parent() factura: Factura): Promise<Reserva | null> {
    if (!factura.id_reserva) {
      return null;
    }
    try {
      return await this.reservasService.findOne(factura.id_reserva);
    } catch (error) {
      console.error(`Error al resolver reserva para factura ${factura.id_factura}:`, error);
      return null;
    }
  }
}
