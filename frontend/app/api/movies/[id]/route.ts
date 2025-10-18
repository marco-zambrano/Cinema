import { NextResponse } from "next/server"
import type { Movie, Funcion } from "@/lib/types"

// Mock movie data (same as in movies/route.ts)
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
  {
    id_pelicula: "4",
    titulo: "Toy Story 4",
    sinopsis: "Woody y sus amigos emprenden una aventura con un nuevo juguete llamado Forky.",
    genero: "Animación",
    duracion: 100,
    clasificacion: "G",
    imagen_url: "/toy-story-4-movie-poster.jpg",
  },
  {
    id_pelicula: "5",
    titulo: "El Conjuro",
    sinopsis: "Investigadores paranormales trabajan para ayudar a una familia aterrorizada por una presencia oscura.",
    genero: "Terror",
    duracion: 112,
    clasificacion: "R",
    imagen_url: "/the-conjuring-horror-movie-poster.jpg",
  },
  {
    id_pelicula: "6",
    titulo: "La La Land",
    sinopsis: "Una actriz aspirante y un músico de jazz dedicado luchan por hacer realidad sus sueños.",
    genero: "Romance",
    duracion: 128,
    clasificacion: "PG-13",
    imagen_url: "/la-la-land-movie-poster.jpg",
  },
  {
    id_pelicula: "7",
    titulo: "Avengers: Endgame",
    sinopsis:
      "Los Vengadores restantes deben encontrar una manera de recuperar a sus aliados para un enfrentamiento épico.",
    genero: "Acción",
    duracion: 181,
    clasificacion: "PG-13",
    imagen_url: "/generic-superhero-team-poster.png",
  },
  {
    id_pelicula: "8",
    titulo: "Superbad",
    sinopsis: "Dos amigos inseparables intentan hacer que su última noche antes de la universidad sea inolvidable.",
    genero: "Comedia",
    duracion: 113,
    clasificacion: "R",
    imagen_url: "/superbad-comedy-movie-poster.jpg",
  },
]

// Mock funciones (showtimes) data
const funciones: Funcion[] = [
  // Movie 1 - El Caballero de la Noche
  { id_funcion: "f1", id_pelicula: "1", id_sala: "s1", fecha: "2025-01-20", hora: "14:00", precio: 12.5 },
  { id_funcion: "f2", id_pelicula: "1", id_sala: "s2", fecha: "2025-01-20", hora: "17:30", precio: 12.5 },
  { id_funcion: "f3", id_pelicula: "1", id_sala: "s1", fecha: "2025-01-20", hora: "20:00", precio: 15.0 },
  { id_funcion: "f4", id_pelicula: "1", id_sala: "s3", fecha: "2025-01-21", hora: "15:00", precio: 12.5 },
  { id_funcion: "f5", id_pelicula: "1", id_sala: "s2", fecha: "2025-01-21", hora: "19:00", precio: 15.0 },

  // Movie 2 - Inception
  { id_funcion: "f6", id_pelicula: "2", id_sala: "s2", fecha: "2025-01-20", hora: "13:30", precio: 12.5 },
  { id_funcion: "f7", id_pelicula: "2", id_sala: "s1", fecha: "2025-01-20", hora: "16:45", precio: 12.5 },
  { id_funcion: "f8", id_pelicula: "2", id_sala: "s3", fecha: "2025-01-20", hora: "21:00", precio: 15.0 },
  { id_funcion: "f9", id_pelicula: "2", id_sala: "s1", fecha: "2025-01-21", hora: "14:30", precio: 12.5 },

  // Movie 3 - Parasite
  { id_funcion: "f10", id_pelicula: "3", id_sala: "s3", fecha: "2025-01-20", hora: "15:00", precio: 12.5 },
  { id_funcion: "f11", id_pelicula: "3", id_sala: "s2", fecha: "2025-01-20", hora: "18:30", precio: 15.0 },
  { id_funcion: "f12", id_pelicula: "3", id_sala: "s1", fecha: "2025-01-21", hora: "16:00", precio: 12.5 },

  // Movie 4 - Toy Story 4
  { id_funcion: "f13", id_pelicula: "4", id_sala: "s1", fecha: "2025-01-20", hora: "12:00", precio: 10.0 },
  { id_funcion: "f14", id_pelicula: "4", id_sala: "s2", fecha: "2025-01-20", hora: "14:30", precio: 10.0 },
  { id_funcion: "f15", id_pelicula: "4", id_sala: "s3", fecha: "2025-01-21", hora: "11:00", precio: 10.0 },

  // Movie 5 - El Conjuro
  { id_funcion: "f16", id_pelicula: "5", id_sala: "s2", fecha: "2025-01-20", hora: "19:30", precio: 15.0 },
  { id_funcion: "f17", id_pelicula: "5", id_sala: "s3", fecha: "2025-01-20", hora: "22:00", precio: 15.0 },
  { id_funcion: "f18", id_pelicula: "5", id_sala: "s1", fecha: "2025-01-21", hora: "20:30", precio: 15.0 },

  // Movie 6 - La La Land
  { id_funcion: "f19", id_pelicula: "6", id_sala: "s1", fecha: "2025-01-20", hora: "13:00", precio: 12.5 },
  { id_funcion: "f20", id_pelicula: "6", id_sala: "s3", fecha: "2025-01-20", hora: "16:00", precio: 12.5 },
  { id_funcion: "f21", id_pelicula: "6", id_sala: "s2", fecha: "2025-01-21", hora: "17:00", precio: 12.5 },

  // Movie 7 - Avengers: Endgame
  { id_funcion: "f22", id_pelicula: "7", id_sala: "s3", fecha: "2025-01-20", hora: "14:00", precio: 15.0 },
  { id_funcion: "f23", id_pelicula: "7", id_sala: "s1", fecha: "2025-01-20", hora: "18:00", precio: 15.0 },
  { id_funcion: "f24", id_pelicula: "7", id_sala: "s2", fecha: "2025-01-21", hora: "15:30", precio: 15.0 },

  // Movie 8 - Superbad
  { id_funcion: "f25", id_pelicula: "8", id_sala: "s2", fecha: "2025-01-20", hora: "15:30", precio: 12.5 },
  { id_funcion: "f26", id_pelicula: "8", id_sala: "s3", fecha: "2025-01-20", hora: "19:00", precio: 15.0 },
  { id_funcion: "f27", id_pelicula: "8", id_sala: "s1", fecha: "2025-01-21", hora: "18:00", precio: 12.5 },
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  // Find movie
  const movie = movies.find((m) => m.id_pelicula === id)

  if (!movie) {
    return NextResponse.json({ error: "Película no encontrada" }, { status: 404 })
  }

  // Get funciones for this movie
  const movieFunciones = funciones.filter((f) => f.id_pelicula === id)

  return NextResponse.json({
    movie,
    funciones: movieFunciones,
  })
}
