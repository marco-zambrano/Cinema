"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MovieCard } from "@/components/movies/movie-card"
import { MovieFilters } from "@/components/movies/movie-filters"
import { movieService } from "@/lib/api"
import type { Pelicula } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  const router = useRouter()
  const { token, user, isLoading } = useAuth()
  const [movies, setMovies] = useState<Pelicula[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Pelicula[]>([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirigir a /login si no hay usuario autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Cargar películas cuando el token esté disponible
  useEffect(() => {
    const fetchMovies = async () => {
      if (!token) {
        setIsLoadingMovies(false)
        return
      }

      try {
        setIsLoadingMovies(true)
        setError(null)
        
        const peliculas = await movieService.getAll(token)
        
        // Mapear las películas para asegurar que tengan el formato correcto
        const mappedMovies: Pelicula[] = peliculas.map((pelicula: any) => ({
          id_pelicula: pelicula.id_pelicula,
          titulo: pelicula.titulo || '',
          genero: pelicula.genero || '',
          descripcion: pelicula.descripcion || '',
          clasificacion: pelicula.clasificacion || '',
          duracion: typeof pelicula.duracion === 'string' 
            ? parseInt(pelicula.duracion) || 0 
            : pelicula.duracion || 0,
          imagen_url: pelicula.image_url || pelicula.imagen_url || '',
        }))
        
        setMovies(mappedMovies)
        setFilteredMovies(mappedMovies)
      } catch (err) {
        console.error('Error al cargar películas:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar las películas')
        setMovies([])
        setFilteredMovies([])
      } finally {
        setIsLoadingMovies(false)
      }
    }

    fetchMovies()
  }, [token])

  const handleFilter = (filters: { search: string; genre: string; classification: string }) => {
    let filtered = [...movies]

    if (filters.search) {
      filtered = filtered.filter((movie) => 
        movie.titulo.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.genre && filters.genre !== "all") {
      filtered = filtered.filter(
        (movie) => movie.genero.toLowerCase() === filters.genre.toLowerCase()
      )
    }

    if (filters.classification && filters.classification !== "all") {
      filtered = filtered.filter(
        (movie) => movie.clasificacion.toLowerCase() === filters.classification.toLowerCase()
      )
    }

    setFilteredMovies(filtered)
  }

  // Mostrar skeleton mientras se carga la autenticación o las películas
  if (isLoading || isLoadingMovies) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // No renderizar nada si no hay usuario (mientras se redirige)
  if (!user) {
    return null
  }

  // Mostrar error si hay un problema al cargar las películas
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container py-8 px-4 md:px-6 lg:px-8 w-full mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Cartelera
          </h1>
          <p className="text-lg text-muted-foreground">
            Descubre las películas en exhibición y reserva tus boletos
          </p>
        </div>

        <MovieFilters onFilter={handleFilter} />

        {filteredMovies.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No se encontraron películas</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMovies.map((pelicula) => (
              <MovieCard key={pelicula.id_pelicula} pelicula={pelicula} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
