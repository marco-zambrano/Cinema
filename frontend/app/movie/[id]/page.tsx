"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Movie, Funcion } from "@/lib/types"
import Image from "next/image"
import { Clock, Calendar, ArrowLeft } from "lucide-react"

export default function MovieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [funciones, setFunciones] = useState<Funcion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedFuncion, setSelectedFuncion] = useState<string>("")

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`/api/movies/${params.id}`)
        const data = await response.json()
        setMovie(data.movie)
        setFunciones(data.funciones)

        // Set default date to first available
        if (data.funciones.length > 0) {
          const uniqueDates = Array.from(new Set(data.funciones.map((f: Funcion) => f.fecha)))
          setSelectedDate(uniqueDates[0] as string)
        }
      } catch (error) {
        console.error("Error fetching movie details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovieDetails()
  }, [params.id])

  const availableDates = Array.from(new Set(funciones.map((f) => f.fecha))).sort()
  const funcionesForDate = funciones.filter((f) => f.fecha === selectedDate)

  const handleReserve = () => {
    if (selectedFuncion) {
      router.push(`/seat-selection/${selectedFuncion}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Película no encontrada</h1>
            <Button onClick={() => router.push("/")}>Volver a la cartelera</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[400px] w-full md:h-[500px]">
          <Image
            src={movie.imagen_url || `/placeholder.svg?height=500&width=1200&query=${encodeURIComponent(movie.titulo)}`}
            alt={movie.titulo}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>

              <h1 className="mb-4 text-balance text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
                {movie.titulo}
              </h1>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {movie.genero}
                </Badge>
                <Badge variant="outline">{movie.clasificacion}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {movie.duracion} min
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 py-8 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column - Movie Info */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-2xl font-bold text-foreground">Sinopsis</h2>
                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{movie.sinopsis}</p>
              </div>

              {/* Right Column - Booking */}
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold text-foreground">Reservar Boletos</h3>

                    <div className="space-y-4">
                      {/* Date Selector */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Selecciona una fecha</label>
                        <Select value={selectedDate} onValueChange={setSelectedDate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige una fecha" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.map((date) => (
                              <SelectItem key={date} value={date}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Time Selector */}
                      {selectedDate && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Selecciona un horario
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {funcionesForDate.map((funcion) => (
                              <Button
                                key={funcion.id_funcion}
                                variant={selectedFuncion === funcion.id_funcion ? "default" : "outline"}
                                onClick={() => setSelectedFuncion(funcion.id_funcion)}
                                className="h-auto flex-col gap-1 py-3"
                              >
                                <span className="text-base font-semibold">{funcion.hora}</span>
                                <span className="text-xs opacity-80">${funcion.precio.toFixed(2)}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reserve Button */}
                      <Button onClick={handleReserve} disabled={!selectedFuncion} className="w-full" size="lg">
                        Continuar a Selección de Asientos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
