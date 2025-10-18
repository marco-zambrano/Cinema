import { NextResponse } from "next/server"
import type { Movie } from "@/lib/types"

// Mock movie data
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

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(movies)
}
