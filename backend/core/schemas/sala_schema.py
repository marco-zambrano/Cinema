import strawberry
from typing import Optional
from core.models import Sala

@strawberry.django.type(Sala)
class SalaType:
    id_sala: strawberry.ID
    nombre: str
    capacidad: int
    tipo: str
    estado: str

@strawberry.type
class Query:
    sala: Optional[SalaType] = strawberry.django.field()
    all_salas: list[SalaType] = strawberry.django.field()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_sala(self, nombre: str, capacidad: Optional[int] = None, tipo: Optional[str] = None, estado: Optional[str] = None) -> SalaType:
        return Sala.objects.create(nombre=nombre, capacidad=capacidad, tipo=tipo, estado=estado)
    
    @strawberry.mutation
    def update_sala(self, id_sala: str, nombre: Optional[str] = None, capacidad: Optional[int] = None, tipo: Optional[str] = None, estado: Optional[str] = None) -> Optional[SalaType]:
        try:
            sala = Sala.objects.get(id_sala=id_sala)
            if nombre is not None:
                sala.nombre = nombre
            if capacidad is not None:
                sala.capacidad = capacidad
            if tipo is not None:
                sala.tipo = tipo
            if estado is not None:
                sala.estado = estado
            sala.save()
            return sala
        except Sala.DoesNotExist:
            return 'Sala no encontrada'
    
    @strawberry.mutation
    def delete_sala(self, id_sala: str) -> bool:
        try:
            sala = Sala.objects.get(id_sala=id_sala)
            sala.delete()
            return 'Sala eliminada correctamente'
        except Sala.DoesNotExist:
            return 'Sala no encontrada'