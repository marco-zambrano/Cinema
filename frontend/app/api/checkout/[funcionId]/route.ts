import { NextResponse } from "next/server"
import type { Funcion, Movie, Sala, Asiento } from "@/lib/types"

// Mock data (same as other routes)
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
]

const funciones: Funcion[] = [
  { id_funcion: "f1", id_pelicula: "1", id_sala: "s1", fecha: "2025-01-20", hora: "14:00", precio: 12.5 },
  { id_funcion: "f2", id_pelicula: "1", id_sala: "s2", fecha: "2025-01-20", hora: "17:30", precio: 12.5 },
  { id_funcion: "f6", id_pelicula: "2", id_sala: "s2", fecha: "2025-01-20", hora: "13:30", precio: 12.5 },
]

const salas: Sala[] = [
  { id_sala: "s1", nombre: "Sala 1", capacidad: 80, filas: 8, columnas: 10 },
  { id_sala: "s2", nombre: "Sala 2", capacidad: 60, filas: 6, columnas: 10 },
  { id_sala: "s3", nombre: "Sala 3", capacidad: 100, filas: 10, columnas: 10 },
]

function generateSeats(sala: Sala): Asiento[] {
  const seats: Asiento[] = []
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

  for (let i = 0; i < sala.filas; i++) {
    for (let j = 1; j <= sala.columnas; j++) {
      seats.push({
        id_asiento: `${sala.id_sala}-${rows[i]}${j}`,
        id_sala: sala.id_sala,
        fila: rows[i],
        numero: j,
        estado: "disponible",
      })
    }
  }

  return seats
}

export async function GET(request: Request, { params }: { params: { funcionId: string } }) {
  const { funcionId } = params
  const { searchParams } = new URL(request.url)
  const seatIds = searchParams.get("seatIds")?.split(",") || []

  const funcion = funciones.find((f) => f.id_funcion === funcionId)

  if (!funcion) {
    return NextResponse.json({ error: "Función no encontrada" }, { status: 404 })
  }

  const movie = movies.find((m) => m.id_pelicula === funcion.id_pelicula)
  const sala = salas.find((s) => s.id_sala === funcion.id_sala)

  if (!movie || !sala) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 404 })
  }

  const allSeats = generateSeats(sala)
  const selectedSeats = allSeats.filter((seat) => seatIds.includes(seat.id_asiento))

  return NextResponse.json({
    funcion,
    movie,
    sala,
    seats: selectedSeats,
  })
}
