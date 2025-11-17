const GRAPHQL_URL = 'http://localhost:3001/graphql';

export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, any>;
  token?: string;
  nextOptions?: RequestInit;
};

export async function fetchGraphQL<T>({ query, variables, token, nextOptions }: GraphQLRequestOptions): Promise<T> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      ...nextOptions,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`GraphQL HTTP ${res.status}: ${text}`);
    }

    const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }>; };
    if (body.errors && body.errors.length) {
      throw new Error(body.errors.map(e => e.message).join('\n'));
    }
    return body.data as T;
  } catch (error) {
    // Mejorar el manejo de errores de CORS y red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (error.message.includes('CORS')) {
        throw new Error(
          'Error de CORS: El servidor GraphQL no está permitiendo peticiones desde este origen. ' +
          'Verifica que el servidor GraphQL esté corriendo y tenga CORS habilitado.'
        );
      }
      throw new Error(
        `Error de conexión: No se pudo conectar al servidor GraphQL en ${GRAPHQL_URL}. ` +
        'Verifica que el servidor esté corriendo.'
      );
    }
    throw error;
  }
}

// Queries
export const QUERIES = {
  MOVIES: `
    query GetMovies {
      peliculas {
        id_pelicula
        titulo
        genero
        descripcion
        clasificacion
        duracion
        image_url
      }
    }
  `,
  MOVIE_BY_ID: `
    query GetMovieById($id: String!) {
      pelicula(id: $id) {
        id_pelicula
        titulo
        genero
        descripcion
        clasificacion
        duracion
        image_url
      }
    }
  `,
  FUNCTIONS: `
    query GetFunctions {
      funciones {
        id_funcion
        fecha_hora
        precio
        peliculas { 
          id_pelicula 
          titulo 
          genero 
          clasificacion 
          duracion 
        }
        salas { 
          id_sala 
          nombre 
          capacidad 
          tipo
          estado
          filas 
          columnas 
        }
      }
    }
  `,
  FUNCTION_BY_ID: `
    query GetFunctionById($id: String!) {
      funcion(id: $id) {
        id_funcion
        fecha_hora
        precio
        peliculas { 
          id_pelicula 
          titulo 
          genero 
          clasificacion 
          duracion 
        }
        salas { 
          id_sala 
          nombre 
          capacidad 
          tipo
          estado
          filas 
          columnas 
        }
      }
    }
  `,

  FUNCTIONS_BY_MOVIE: `
    query GetFunctionsByMovie($id_pelicula: String!) {
      funcionesPorPelicula(id_pelicula: $id_pelicula) {
        id_funcion
        fecha_hora
        precio
        salas { 
          id_sala 
          nombre 
          capacidad 
          tipo
          estado
          filas 
          columnas 
        }
      }
    }
  `,

  RESERVATIONS: `
    query GetReservations {
      reservas {
        id_reserva
        id_usuario
        id_funcion
        cantidad_asientos
        estado
        total
        fecha_reserva
        pelicula {
          id_pelicula
          titulo
          genero
          descripcion
          clasificacion
          duracion
          image_url
        }
        funcion {
          id_funcion
          fecha_hora
          precio
          salas {
            id_sala
            nombre
            capacidad
            tipo
            estado
            filas
            columnas
          }
        }
        asientos {
          id_asiento
          numero
          estado
        }
      }
    }
  `,
  RESERVATION_BY_ID: `
    query GetReservationById($id: String!) {
      reserva(id: $id) {
        id_reserva
        id_usuario
        id_funcion
        cantidad_asientos
        estado
        total
        fecha_reserva
        pelicula {
          id_pelicula
          titulo
          genero
          descripcion
          clasificacion
          duracion
          image_url
        }
        funcion {
          id_funcion
          fecha_hora
          precio
          salas {
            id_sala
            nombre
            capacidad
            tipo
            estado
            filas
            columnas
          }
        }
        asientos {
          id_asiento
          numero
          estado
        }
      }
    }
  `,
  RESERVATIONS_BY_USER: `
    query GetReservationsByUser($id_usuario: String!) {
      reservasPorUsuario(id_usuario: $id_usuario) {
        id_reserva
        id_usuario
        id_funcion
        cantidad_asientos
        estado
        total
        fecha_reserva
        pelicula {
          id_pelicula
          titulo
          genero
          descripcion
          clasificacion
          duracion
          image_url
        }
        funcion {
          id_funcion
          fecha_hora
          precio
          salas {
            id_sala
            nombre
            capacidad
            tipo
            estado
            filas
            columnas
          }
        }
        asientos {
          id_asiento
          numero
          estado
        }
      }
    }
  `,
};
