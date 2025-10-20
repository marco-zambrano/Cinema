import strawberry
from core.models import Pelicula
from uuid import UUID
from typing import Optional

@strawberry.django.type(Pelicula)
class PeliculaType:
    id_pelicula: strawberry.ID
    titulo: str
    genero: Optional[str]
    descripcion: Optional[str]
    clasificacion: str

@strawberry.type
class Query:
    pelicula: Optional[PeliculaType] = strawberry.django.field()
    all_peliculas: list[PeliculaType] = strawberry.django.field()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_pelicula(self, titulo: str, genero: Optional[str] = None, descripcion: Optional[str] = None, clasificacion: str = "") -> PeliculaType:
        return Pelicula.objects.create(titulo=titulo, genero=genero, descripcion=descripcion, clasificacion=clasificacion)
    

    @strawberry.mutation
    def update_pelicula(self, id_pelicula: UUID, titulo: Optional[str] = None, genero: Optional[str] = None, descripcion: Optional[str] = None, clasificacion: Optional[str] = None) -> Optional[PeliculaType]:
        try:
            pelicula = Pelicula.objects.get(id_pelicula=id_pelicula)
            if titulo is not None:
                pelicula.titulo = titulo
            if genero is not None:
                pelicula.genero = genero
            if descripcion is not None:
                pelicula.descripcion = descripcion
            if clasificacion is not None:
                pelicula.clasificacion = clasificacion
            pelicula.save()
            return pelicula
        except Pelicula.DoesNotExist:
            return None
    
    @strawberry.mutation
    def delete_pelicula(self, id_pelicula: UUID) -> bool:
        try:
            pelicula = Pelicula.objects.get(id_pelicula=id_pelicula)
            pelicula.delete()
            return 'Pelicula eliminada correctamente'
        except Pelicula.DoesNotExist:
            return 'Pelicula no encontrada'