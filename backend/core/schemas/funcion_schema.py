import strawberry
from uuid import UUID
from core.models import Funcion
from core.schemas.pelicula_schema import PeliculaType
from core.schemas.sala_schema import SalaType
from typing import List, Optional

@strawberry.django.type(Funcion)
class FuncionType:
    id_funcion: strawberry.ID
    fecha_hora: str
    precio: float
    id_pelicula: PeliculaType = strawberry.django.field()
    id_sala: SalaType = strawberry.django.field()

@strawberry.type
class Query:
    funcion: Optional[FuncionType] = strawberry.django.field()
    all_funciones: List[FuncionType] = strawberry.django.field()

@strawberry.type
class Mutation:

    @strawberry.mutation
    def create_funcion(self, fecha_hora: str, precio: float, id_pelicula: UUID, id_sala: UUID) -> FuncionType:
        return Funcion.objects.create(fecha_hora=fecha_hora, precio=precio, id_pelicula_id=id_pelicula, id_sala_id=id_sala)

    @strawberry.mutation
    def update_funcion(self, id_funcion: UUID, fecha_hora: Optional[str] = None, precio: Optional[float] = None, id_pelicula: Optional[UUID] = None, id_sala: Optional[UUID] = None) -> FuncionType:
        try:
            funcion = Funcion.objects.get(id_funcion=id_funcion)
            if fecha_hora is not None:
                funcion.fecha_hora = fecha_hora
            if precio is not None:
                funcion.precio = precio
            if id_pelicula is not None:
                funcion.id_pelicula_id = id_pelicula
            if id_sala is not None:
                funcion.id_sala_id = id_sala
            funcion.save()
            return funcion
        except Funcion.DoesNotExist:
            return 'Funcion no encontrada'
    
    def delete_funcion(self, id_funcion: UUID) -> bool:
        try:
            funcion = Funcion.objects.get(id_funcion=id_funcion)
            funcion.delete()
            return 'Funcion eliminada correctamente'
        except Funcion.DoesNotExist:
            return 'Funcion no encontrada'