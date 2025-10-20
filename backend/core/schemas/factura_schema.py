import strawberry
from uuid import UUID
from core.models import Factura
from core.schemas.reserva_schema import ReservaType

@strawberry.django.type(Factura)
class FacturaType:
    id_factura: strawberry.ID
    fecha_emision: str
    total: float | None
    metodo_pago: str | None
    id_reserva: ReservaType = strawberry.django.field()

@strawberry.type
class Query:
    factura: FacturaType = strawberry.django.field()
    all_facturas: list[FacturaType] = strawberry.django.field()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_factura(self, fecha_emision: str, total: float | None = None, metodo_pago: str | None = None, id_reserva: UUID | None = None) -> FacturaType:
        return Factura.objects.create(
            fecha_emision=fecha_emision,
            total=total,
            metodo_pago=metodo_pago,
            id_reserva_id=id_reserva
        )
    
    @strawberry.mutation
    def update_factura(self, id_factura: UUID, fecha_emision: str | None = None, total: float | None = None, metodo_pago: str | None = None, id_reserva: UUID | None = None) -> FacturaType:
        try:
            factura = Factura.objects.get(id_factura=id_factura)
            if fecha_emision is not None:
                factura.fecha_emision = fecha_emision
            if total is not None:
                factura.total = total
            if metodo_pago is not None:
                factura.metodo_pago = metodo_pago
            if id_reserva is not None:
                factura.id_reserva_id = id_reserva
            factura.save()
            return factura
        except Factura.DoesNotExist:
            return 'Factura no encontrada'
    
    @strawberry.mutation
    def delete_factura(self, id_factura: UUID) -> bool:
        try:
            factura = Factura.objects.get(id_factura=id_factura)
            factura.delete()
            return 'Factura eliminada correctamente'
        except Factura.DoesNotExist:
            return 'Factura no encontrada'