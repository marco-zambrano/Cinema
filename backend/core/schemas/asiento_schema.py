import strawberry
from core.models import Asiento
from typing import List, Optional
from uuid import UUID
from core.schemas.sala_schema import SalaType

#Type es la representación de un asiento en el sistema
@strawberry.django.type(Asiento)
class AsientoType:
    id_asiento: strawberry.ID
    numero: int
    estado: Optional[str]
    id_sala: Optional[SalaType] = strawberry.django.field()

#Queries son las operaciones de lectura para los asientos
@strawberry.type
class Query:                                    #.field sirve para definir campos en el esquema GraphQL
    asiento: Optional[AsientoType] = strawberry.django.field() #El valor dentro de los corchetes dentro de Optional sirve para indicar que el valor puede ser del tipo AsientoType o None
    all_asientos: List[AsientoType] = strawberry.django.field() #El valor dentro de los corchetes dentro de List sirve para indicar que el valor es una lista de objetos del tipo AsientoType

@strawberry.type
class Mutation: #Class mutation es para las operaciones de escritura y modificación de entidades en la base de datos
    @strawberry.mutation
    def create_asiento(self, numero: int, estado: Optional[str] = None) -> AsientoType:
        return Asiento.objects.create(numero=numero, estado=estado)
    
    @strawberry.mutation
    def update_asiento(self, id_asiento: UUID, numero: Optional[int] = None, estado: Optional[str] = None) -> Optional[AsientoType]:
        
        try:
            asiento = Asiento.objects.get(id_asiento=id_asiento)
            if numero is not None:
                asiento.numero = numero
            if estado is not None:
                asiento.estado = estado
            asiento.save()
            return asiento
        except Asiento.DoesNotExist:
            return 'Asiento no encontrado'
    

    @strawberry.mutation
    def delete_asiento(self, id_asiento: UUID) -> bool:
        try:
            asiento = Asiento.objects.get(id_asiento=id_asiento)
            asiento.delete()
            return 'Asiento eliminado correctamente'
        except Asiento.DoesNotExist:
            return 'Asiento no encontrado'
    