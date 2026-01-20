import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { fetchGraphQL, QUERIES } from "./graphql";

type Method = "GET" | "POST" | "PUT" | "DELETE";

// Helper para obtener el token del localStorage automáticamente
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// Función mejorada que usa el token del localStorage si no se proporciona uno
async function apiRequest<T>(
  endpoint: string,
  method: Method = "GET",
  data?: any,
  token?: string | null
): Promise<T> {
  // Si no se proporciona token, intentar obtenerlo del localStorage
  const authToken = token ?? getStoredToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include", // Para manejar cookies si es necesario
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = "Error en la solicitud";
      try {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        errorMessage =
          errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      throw new Error(errorMessage);
    }

    // Si la respuesta es 204 No Content, no intentamos hacer .json()
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("API Request Error:", {
      url,
      method,
      error: errorMessage,
    });
    throw error;
  }
}

// Servicios específicos (sin authService aquí, ya está en lib/auth-service.ts)

export const movieService = {
  getAll: async (token: string) => {
    const data = await fetchGraphQL<{ peliculas: any[] }>({
      query: QUERIES.MOVIES,
      token,
    });
    return data.peliculas;
  },

  getById: async (id: string, token: string) => {
    const data = await fetchGraphQL<{ pelicula: any }>({
      query: QUERIES.MOVIE_BY_ID,
      variables: { id },
      token,
    });
    return data.pelicula;
  },
};

export const functionService = {
  getAll: (token: string) =>
    apiRequest<any[]>(API_ENDPOINTS.FUNCTIONS.LIST, "GET", undefined, token),

  getById: (id: string, token: string) =>
    apiRequest<any>(
      API_ENDPOINTS.FUNCTIONS.DETAIL(id),
      "GET",
      undefined,
      token
    ),

  getByMovieId: async (movieId: string, token: string) => {
    // ⭐ USAR LA NUEVA QUERY funcionesPorPelicula
    const data = await fetchGraphQL<{ funcionesPorPelicula: any[] }>({
      query: QUERIES.FUNCTIONS_BY_MOVIE, // ⬅️ Nueva query (la agregaremos)
      variables: { id_pelicula: movieId },
      token,
    });
    
    const funciones = data.funcionesPorPelicula || [];
    
    // Adaptar al contrato del frontend
    const mapped = funciones.map((f: any) => ({
      id_funcion: f.id_funcion,
      fecha_hora: f.fecha_hora,
      precio: typeof f.precio === 'string' ? parseFloat(f.precio) : f.precio,
      id_pelicula: movieId,
      id_sala: f.salas?.[0]?.id_sala ?? undefined,
    }));
    
    console.log(`✅ Encontradas ${mapped.length} funciones para película ${movieId}:`, mapped);
    
    return mapped;
  },

  getByIdGraphQL: async (id: string, token: string) => {
    const data = await fetchGraphQL<{ funcion: any }>({
      query: QUERIES.FUNCTION_BY_ID,
      variables: { id },
      token,
    });
    return data.funcion;
  },

  getOccupiedSeats: (funcionId: string, token: string) =>
    apiRequest<any[]>(
      API_ENDPOINTS.FUNCTIONS.OCCUPIED_SEATS(funcionId),
      "GET",
      undefined,
      token
    ),
};

export const seatService = {
  create: (data: { numero: string; estado: string; id_sala: string }, token: string) =>
    apiRequest<any>(API_ENDPOINTS.SEATS.CREATE, "POST", data, token),

  getAll: (token: string) =>
    apiRequest<any[]>(API_ENDPOINTS.SEATS.LIST, "GET", undefined, token),

  getById: (id: string, token: string) =>
    apiRequest<any>(
      API_ENDPOINTS.SEATS.DETAIL(id),
      "GET",
      undefined,
      token
    ),

  update: (id: string, data: { numero?: string; estado?: string; id_sala?: string }, token: string) =>
    apiRequest<any>(API_ENDPOINTS.SEATS.UPDATE(id), "PUT", data, token),
};

export const reservationService = {
  create: (data: {
    cantidad_asientos: number;
    estado: string;
    id_funcion: string;
    id_usuario: string;
    total: number;
    fecha_reserva: string;
  }, token: string) =>
    apiRequest<any>(API_ENDPOINTS.RESERVATIONS.CREATE, "POST", data, token),

  getAll: (token: string) =>
    apiRequest<any[]>(API_ENDPOINTS.RESERVATIONS.LIST, "GET", undefined, token),

  getById: (id: string, token: string) =>
    apiRequest<any>(
      API_ENDPOINTS.RESERVATIONS.DETAIL(id),
      "GET",
      undefined,
      token
    ),

  addSeat: (reservationId: string, seatId: string, token?: string | null) =>
    apiRequest<any>(
      API_ENDPOINTS.ReservaAsiento.CREATE(reservationId, seatId),
      "POST",
      undefined,
      token
    ),

  // Métodos GraphQL
  getAllGraphQL: async (token: string) => {
    const data = await fetchGraphQL<{ reservas: any[] }>({
      query: QUERIES.RESERVATIONS,
      token,
    });
    return data.reservas || [];
  },

  getByIdGraphQL: async (id: string, token: string) => {
    const data = await fetchGraphQL<{ reserva: any }>({
      query: QUERIES.RESERVATION_BY_ID,
      variables: { id },
      token,
    });
    return data.reserva;
  },

  getByUserIdGraphQL: async (userId: string, token: string) => {
    const data = await fetchGraphQL<{ reservasPorUsuario: any[] }>({
      query: QUERIES.RESERVATIONS_BY_USER,
      variables: { id_usuario: userId },
      token,
    });
    return data.reservasPorUsuario || [];
  },
};

export const facturaService = {
  create: (data: {
    fecha_emision: string;
    total: number;
    metodo_pago: string;
    id_reserva: string;
  }, token: string) =>
    apiRequest<any>(API_ENDPOINTS.FACTURAS.CREATE, "POST", data, token),

  getAll: (token: string) =>
    apiRequest<any[]>(API_ENDPOINTS.FACTURAS.LIST, "GET", undefined, token),

  getById: (id: string, token: string) =>
    apiRequest<any>(
      API_ENDPOINTS.FACTURAS.DETAIL(id),
      "GET",
      undefined,
      token
    ),

  update: (id: string, data: {
    fecha_emision?: string;
    total?: number;
    metodo_pago?: string;
    id_reserva?: string;
  }, token: string) =>
    apiRequest<any>(API_ENDPOINTS.FACTURAS.UPDATE(id), "PUT", data, token),

  delete: (id: string, token: string) =>
    apiRequest<void>(API_ENDPOINTS.FACTURAS.DELETE(id), "DELETE", undefined, token),
};

// Servicio de usuarios (requiere autenticación)
export const usuarioService = {
  getAll: (skip: number = 0, limit: number = 100, token?: string | null) =>
    apiRequest<any[]>(`/usuarios?skip=${skip}&limit=${limit}`, "GET", undefined, token),

  getById: (id: string, token?: string | null) =>
    apiRequest<any>(`/usuarios/${id}`, "GET", undefined, token),

  getMe: (token?: string | null) =>
    apiRequest<any>("/usuarios/me", "GET", undefined, token),

  update: (id: string, data: any, token?: string | null) =>
    apiRequest<any>(`/usuarios/${id}`, "PUT", data, token),

  delete: (id: string, token?: string | null) =>
    apiRequest<void>(`/usuarios/${id}`, "DELETE", undefined, token),
};
