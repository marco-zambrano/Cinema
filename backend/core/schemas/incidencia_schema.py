import strawberry
from core.models import Incidencia
from core.schemas.usuario_schema import UsuarioType
from uuid import UUID

@strawberry.django.type(Incidencia)
class IncidenciaType:
    id_incidencia: strawberry.ID
    fecha_generacion: str
    id_usuario: UsuarioType = strawberry.django.field()

@strawberry.type
class Query:
    incidencia: IncidenciaType = strawberry.django.field()
    all_incidencias: list[IncidenciaType] = strawberry.django.field()

@strawberry.type
class Mutation:

    @strawberry.mutation
    def create_incidencia(self, fecha_generacion: str, id_usuario: UUID) -> IncidenciaType:
        return Incidencia.objects.create(fecha_generacion=fecha_generacion, id_usuario_id=id_usuario)

    @strawberry.mutation
    def update_incidencia(self, id_incidencia: UUID, fecha_generacion: str = None, id_usuario: UUID = None) -> IncidenciaType:
        try:
            incidencia = Incidencia.objects.get(id_incidencia=id_incidencia)
            if fecha_generacion is not None:
                incidencia.fecha_generacion = fecha_generacion
            if id_usuario is not None:
                incidencia.id_usuario_id = id_usuario
            incidencia.save()
            return incidencia
        except Incidencia.DoesNotExist:
            return 'Incidencia no encontrada'
    
    @strawberry.mutation
    def delete_incidencia(self, id_incidencia: UUID) -> bool:
        try:
            incidencia = Incidencia.objects.get(id_incidencia=id_incidencia)
            incidencia.delete()
            return 'Incidencia eliminada correctamente'
        except Incidencia.DoesNotExist:
            return 'Incidencia no encontrada'