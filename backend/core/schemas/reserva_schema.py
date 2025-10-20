import strawberry
from core.models import Reserva
from core.schemas.funcion_schema import FuncionType
from core.schemas.usuario_schema import UsuarioType
from uuid import UUID

@strawberry.django.type(Reserva)
class ReservaType:
    id_reserva: strawberry.ID
    cantidad_asientos: int
    estado: str
    id_usuario: UsuarioType = strawberry.django.field()
    id_funcion: FuncionType = strawberry.django.field()

@strawberry.type
class Query:
    reserva: ReservaType = strawberry.django.field()
    all_reservas: list[ReservaType] = strawberry.django.field()

@strawberry.type
class Mutation:

    @strawberry.mutation
    def create_reserva(self, cantidad_asientos: int, estado: str, id_funcion: UUID, id_usuario: UUID) -> ReservaType:
        return Reserva.objects.create(cantidad_asientos=cantidad_asientos, estado=estado, id_funcion_id=id_funcion, id_usuario_id=id_usuario)

    @strawberry.mutation
    def update_reserva(self, id_reserva: UUID, cantidad_asientos: int = None, estado: str = None, id_funcion: UUID = None, id_usuario: UUID = None) -> ReservaType:
        try:
            reserva = Reserva.objects.get(id_reserva=id_reserva)
            if cantidad_asientos is not None:
                reserva.cantidad_asientos = cantidad_asientos
            if estado is not None:
                reserva.estado = estado
            if id_funcion is not None:
                reserva.id_funcion_id = id_funcion
            if id_usuario is not None:
                reserva.id_usuario_id = id_usuario
            reserva.save()
            return reserva
        except Reserva.DoesNotExist:
            return 'Reserva no encontrada'
    
    @strawberry.mutation
    def delete_reserva(self, id_reserva: UUID) -> bool:
        try:
            reserva = Reserva.objects.get(id_reserva=id_reserva)
            reserva.delete()
            return 'Reserva eliminada correctamente'
        except Reserva.DoesNotExist:
            return 'Reserva no encontrada'