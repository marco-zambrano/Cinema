import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { Pelicula } from 'src/peliculas/entities/pelicula.entity';
import { Funciones } from 'src/funciones/entities/funcione.entity';
import { Asiento } from 'src/asientos/entities/asiento.entity';

@ObjectType()
export class Reserva {
  @Field(() => String)
  id_reserva: string;

  @Field(() => Usuario, { 
    description: 'Usuario que realizó la reserva',
    nullable: true 
  })
  usuario?: Usuario; 

  @Field(() => String, { description: 'ID del usuario que realizó la reserva' })
  id_usuario: string;

  @Field(() => String, { description: 'ID de la función para la que se realizó la reserva' })
  id_funcion: string;

  @Field(() => Int, { description: 'Cantidad de asientos reservados' })
  cantidad_asientos: number;

  @Field(() => String, { description: 'Estado de la reserva (ej: confirmada, cancelada, pendiente)' })
  estado: string;

  @Field(() => Int, { description: 'Monto total de la reserva' })
  total: number;

  @Field(() => String, { description: 'Fecha en que se realizó la reserva' })
  fecha_reserva: string;

  @Field(() => Pelicula, { 
    description: 'Película asociada a la función de la reserva',
    nullable: true 
  })
  pelicula?: Pelicula;

  @Field(() => Funciones, { 
    description: 'Función asociada a la reserva',
    nullable: true 
  })
  funcion?: Funciones;

  @Field(() => [Asiento], { 
    description: 'Asientos asociados a la reserva',
    nullable: true 
  })
  asientos?: Asiento[];
}
