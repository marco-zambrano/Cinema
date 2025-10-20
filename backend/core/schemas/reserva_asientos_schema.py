import strawberry
from core.models import Reserva
from core.schemas.reserva_schema import ReservaType
from core.schemas.asiento_schema import AsientoType

@strawberry.django.type(Reserva)
class ReservaAsientosType:
    id_usuario: ReservaType = strawberry.django.field()
    id_funcion: AsientoType = strawberry.django.field()

@strawberry.type
class Query:
    reserva_asientos: ReservaAsientosType = strawberry.django.field()
    all_reserva_asientos: list[ReservaAsientosType] = strawberry.django.field()

@strawberry.type
class Mutation:

    @strawberry.mutation
    def create_reserva_asientos(self, id_reserva: str, id_asiento: str) -> ReservaAsientosType:
        return Reserva.objects.create(id_reserva=id_reserva, id_asiento=id_asiento)

    @strawberry.mutation
    def update_reserva_asientos(self, id_reserva: str, id_asiento: str) -> ReservaAsientosType:
        try:
            reserva_asiento = Reserva.objects.get(id_reserva=id_reserva, id_asiento=id_asiento)
            reserva_asiento.save()
            return reserva_asiento
        except Reserva.DoesNotExist:
            return 'ReservaAsientos no encontrada'
        
    @strawberry.mutation
    def delete_reserva_asientos(self, id_reserva: str, id_asiento: str) -> bool:
        try:
            reserva_asiento = Reserva.objects.get(id_reserva=id_reserva, id_asiento=id_asiento)
            reserva_asiento.delete()
            return 'ReservaAsientos eliminada correctamente'
        except Reserva.DoesNotExist:
            return 'ReservaAsientos no encontrada'
    