import strawberry
from core.schemas.asiento_schema import Query as AsientoQuery, Mutation as AsientoMutation
from core.schemas.funcion_schema import Query as FuncionQuery, Mutation as FuncionMutation
from core.schemas.pelicula_schema import Query as PeliculaQuery, Mutation as PeliculaMutation
from core.schemas.reserva_asientos_schema import Query as ReservaAsientosQuery, Mutation as ReservaAsientosMutation 
from core.schemas.reserva_schema import Query as ReservaQuery, Mutation as ReservaMutation
from core.schemas.sala_schema import Query as SalaQuery, Mutation as SalaMutation
from core.schemas.usuario_schema import Query as UsuarioQuery, Mutation as UsuarioMutation
from core.schemas.factura_schema import Query as FacturaQuery, Mutation as FacturaMutation
from core.schemas.incidencia_schema import Query as IncidenciaQuery, Mutation as IncidenciaMutation

#Combinamos todos los Query y Mutation en una sola clase
@strawberry.type
class Query(
    AsientoQuery,
    FuncionQuery,
    PeliculaQuery,
    ReservaAsientosQuery,
    ReservaQuery,
    SalaQuery,
    UsuarioQuery,
    FacturaQuery,
    IncidenciaQuery,
):
    pass

@strawberry.type
class Mutation(
    AsientoMutation,
    FuncionMutation,
    PeliculaMutation,
    ReservaAsientosMutation,
    ReservaMutation,
    SalaMutation,
    UsuarioMutation,
    FacturaMutation,
    IncidenciaMutation,
):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation) #Creamos el esquema de GraphQL con las clases Query y Mutation