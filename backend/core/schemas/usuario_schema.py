import strawberry
from typing import Optional
from core.models import Usuario

@strawberry.django.type(Usuario)
class UsuarioType:
    id_usuario: strawberry.ID
    nombre: str
    correo: Optional[str]
    password: Optional[str]
    rol: Optional[str]

@strawberry.type
class Query:
    usuario: Optional[UsuarioType] = strawberry.django.field()
    all_usuarios: list[UsuarioType] = strawberry.django.field()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_usuario(self, nombre: str, correo: Optional[str] = None, password: Optional[str] = None, rol: Optional[str] = None) -> UsuarioType:
        return Usuario.objects.create(nombre=nombre, correo=correo, password=password, rol=rol)

    @strawberry.mutation
    def update_usuario(self, id_usuario: str, nombre: Optional[str] = None, correo: Optional[str] = None, password: Optional[str] = None, rol: Optional[str] = None) -> UsuarioType:
        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            if nombre is not None:
                usuario.nombre = nombre
            if correo is not None:
                usuario.correo = correo
            if password is not None:
                usuario.password = password
            if rol is not None:
                usuario.rol = rol
            usuario.save()
            return usuario
        except Usuario.DoesNotExist:
            return 'Usuario no encontrado'
    
    @strawberry.mutation
    def delete_usuario(self, id_usuario: str) -> bool:
        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            usuario.delete()
            return 'Usuario eliminado correctamente'
        except Usuario.DoesNotExist:
            return 'Usuario no encontrado'
    
