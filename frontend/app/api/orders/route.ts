import { NextResponse } from "next/server"
import type { Reserva, Factura, Movie, Funcion } from "@/lib/types"

// Mock data
const movies: Movie[] = [
  {
    id_pelicula: "1",
    titulo: "El Caballero de la Noche",
    sinopsis:
      "Batman debe aceptar una de las pruebas psicológicas y físicas más grandes para luchar contra la injusticia.",
    genero: "Acción",
    duracion: 152,
    clasificacion: "PG-13",
    imagen_url: "/dark-knight-batman-movie-poster.jpg",
  },
  {
    id_pelicula: "2",
    titulo: "Inception",
    sinopsis: "Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños.",
    genero: "Ciencia Ficción",
    duracion: 148,
    clasificacion: "PG-13",
    imagen_url: "/inception-movie-poster.png",
  },
  {
    id_pelicula: "3",
    titulo: "Parasite",
    sinopsis: "Codicia y discriminación de clases amenazan la relación simbiótica entre una familia rica y una pobre.",
    genero: "Drama",
    duracion: 132,
    clasificacion: "R",
    imagen_url: "/parasite-movie-poster.png",
  },
]

const funciones: Funcion[] = [
  { id_funcion: "f1", id_pelicula: "1", id_sala: "s1", fecha: "2025-01-20", hora: "14:00", precio: 12.5 },
  { id_funcion: "f2", id_pelicula: "1", id_sala: "s2", fecha: "2025-01-20", hora: "17:30", precio: 12.5 },
  { id_funcion: "f6", id_pelicula: "2", id_sala: "s2", fecha: "2025-01-22", hora: "19:30", precio: 12.5 },
  { id_funcion: "f10", id_pelicula: "3", id_sala: "s3", fecha: "2025-01-18", hora: "21:00", precio: 15.0 },
]

// Mock reservations for demo
const mockReservas: Reserva[] = [
  {
    id_reserva: "RES-1737123456789",
    id_usuario: "user-1",
    id_funcion: "f1",
    fecha_reserva: "2025-01-15T10:30:00Z",
    total: 37.5,
    asientos: [
      { id_asiento: "s1-D5", id_sala: "s1", fila: "D", numero: 5, estado: "ocupado" },
      { id_asiento: "s1-D6", id_sala: "s1", fila: "D", numero: 6, estado: "ocupado" },
      { id_asiento: "s1-D7", id_sala: "s1", fila: "D", numero: 7, estado: "ocupado" },
    ],
  },
  {
    id_reserva: "RES-1737023456789",
    id_usuario: "user-1",
    id_funcion: "f6",
    fecha_reserva: "2025-01-14T15:45:00Z",
    total: 25.0,
    asientos: [
      { id_asiento: "s2-C3", id_sala: "s2", fila: "C", numero: 3, estado: "ocupado" },
      { id_asiento: "s2-C4", id_sala: "s2", fila: "C", numero: 4, estado: "ocupado" },
    ],
  },
  {
    id_reserva: "RES-1736923456789",
    id_usuario: "user-1",
    id_funcion: "f10",
    fecha_reserva: "2025-01-10T18:20:00Z",
    total: 15.0,
    asientos: [{ id_asiento: "s3-E8", id_sala: "s3", fila: "E", numero: 8, estado: "ocupado" }],
  },
]

const mockFacturas: Factura[] = [
  {
    id_factura: "FAC-1737123456789",
    id_reserva: "RES-1737123456789",
    total: 37.5,
    metodo_pago: "credit-card",
    fecha: "2025-01-15T10:30:00Z",
  },
  {
    id_factura: "FAC-1737023456789",
    id_reserva: "RES-1737023456789",
    total: 25.0,
    metodo_pago: "paypal",
    fecha: "2025-01-14T15:45:00Z",
  },
  {
    id_factura: "FAC-1736923456789",
    id_reserva: "RES-1736923456789",
    total: 15.0,
    metodo_pago: "cash",
    fecha: "2025-01-10T18:20:00Z",
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID requerido" }, { status: 400 })
  }

  // Filter reservations by user
  const userReservas = mockReservas.filter((r) => r.id_usuario === userId)

  // Enrich with movie, funcion, and factura data
  const ordersWithDetails = userReservas.map((reserva) => {
    const funcion = funciones.find((f) => f.id_funcion === reserva.id_funcion)
    const movie = movies.find((m) => m.id_pelicula === funcion?.id_pelicula)
    const factura = mockFacturas.find((f) => f.id_reserva === reserva.id_reserva)

    return {
      ...reserva,
      movie,
      funcion,
      factura,
    }
  })

  // Sort by date (newest first)
  ordersWithDetails.sort((a, b) => new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime())

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(ordersWithDetails)
}
