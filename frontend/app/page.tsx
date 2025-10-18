"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { MovieCard } from "@/components/movies/movie-card"
import { MovieFilters } from "@/components/movies/movie-filters"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import type { Movie } from "@/lib/types"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch("/api/movies")
        const data = await response.json()
        setMovies(data)
        setFilteredMovies(data)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setIsLoadingMovies(false)
      }
    }

    if (user) {
      fetchMovies()
    }
  }, [user])

  const handleFilter = (filters: { search: string; genre: string; classification: string }) => {
    let filtered = [...movies]

    if (filters.search) {
      filtered = filtered.filter((movie) => movie.titulo.toLowerCase().includes(filters.search.toLowerCase()))
    }

    if (filters.genre && filters.genre !== "all") {
      filtered = filtered.filter((movie) => movie.genero.toLowerCase() === filters.genre.toLowerCase())
    }

    if (filters.classification && filters.classification !== "all") {
      filtered = filtered.filter((movie) => movie.clasificacion === filters.classification)
    }

    setFilteredMovies(filtered)
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-balance text-4xl font-bold text-foreground md:text-5xl">Cartelera</h1>
            <p className="text-pretty text-lg text-muted-foreground">
              Descubre las películas en exhibición y reserva tus boletos
            </p>
          </div>

          <MovieFilters onFilter={handleFilter} />

          {isLoadingMovies ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">No se encontraron películas</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id_pelicula} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
