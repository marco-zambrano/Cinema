export type UserRole = "cliente" | "admin"

export interface User {
  id_usuario: string
  nombre: string
  correo: string
  rol: UserRole
}

export interface Pelicula {
  id_pelicula: string
  titulo: string
  genero: string
  descripcion: string
  clasificacion: string
  duracion: number
  imagen_url: string
}

export interface Funcion {
  id_funcion: string
  id_pelicula: string
  id_sala: string
  fecha_hora: string
  precio: number
}

export interface Sala {
  id_sala: string
  nombre: string
  capacidad: number
  tipo: string
  estado: string
  filas: number
  columnas: number
}

export interface Asiento {
  id_asiento: string
  id_sala: string
  fila: string
  numero: string
  estado: "disponible" | "ocupado" | "seleccionado" | "en-proceso"
}

export interface Reserva {
  id_reserva: string
  id_usuario: string
  id_funcion: string
  fecha_reserva: string
  total: number
  cantidad_asientos: number
  estado: string
}

export interface Factura {
  id_factura: string
  id_reserva: string
  total: number
  metodo_pago: string
  fecha_emision: string
}

export interface ReservaAsiento {
  id_reserva: string
  id_asiento: string
}

export interface AdminStats {
  totalMovies: number
  totalReservations: number
  totalCustomers: number
  totalAdmins: number
  totalFunctions: number
  totalSalas: number
}