export interface User {
  id_usuario: string
  email: string
  nombre: string
  rol: "cliente" | "admin"
}

export interface Movie {
  id_pelicula: string
  titulo: string
  sinopsis: string
  genero: string
  clasificacion: string
  duracion: number
  imagen_url: string
}

export interface Funcion {
  id_funcion: string
  id_pelicula: string
  id_sala: string
  fecha: string
  hora: string
  precio: number
}

export interface Sala {
  id_sala: string
  nombre: string
  capacidad: number
  filas: number
  columnas: number
}

export interface Asiento {
  id_asiento: string
  id_sala: string
  fila: string
  numero: number
  estado: "disponible" | "ocupado" | "seleccionado" | "en-proceso"
}

export interface Reserva {
  id_reserva: string
  id_usuario: string
  id_funcion: string
  fecha_reserva: string
  total: number
  asientos: Asiento[]
}

export interface Factura {
  id_factura: string
  id_reserva: string
  total: number
  metodo_pago: string
  fecha: string
}
