"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Pelicula, Funcion } from "@/lib/types"
import { movieService, functionService } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { Clock, Calendar, ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function MovieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const [movie, setMovie] = useState<Pelicula | null>(null)
  const [funciones, setFunciones] = useState<Funcion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedFuncion, setSelectedFuncion] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [funcionesForDate, setFuncionesForDate] = useState<Funcion[]>([])

  // Función auxiliar para extraer solo la fecha (YYYY-MM-DD) de un timestamp
  // Sin conversión de zona horaria para evitar que cambie el día
  const extractDate = (fechaHora: string): string => {
    // Si el string ya tiene formato YYYY-MM-DD, retornarlo directamente
    if (fechaHora.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fechaHora
    }
    // Si es un timestamp ISO, extraer solo la parte de fecha sin conversión de zona horaria
    if (fechaHora.includes('T')) {
      return fechaHora.split('T')[0] // Retorna YYYY-MM-DD directamente del string
    }
    // Fallback: parsear y usar UTC para evitar cambios de día
    const date = new Date(fechaHora)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Función auxiliar para formatear fecha en español
  // Usa UTC para evitar cambios de día por zona horaria
  const formatDateSpanish = (dateString: string): string => {
    // Si es formato YYYY-MM-DD, parsearlo directamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day))
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
      })
    }
    // Si es un timestamp ISO, extraer la fecha y formatear
    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const utcDate = new Date(Date.UTC(year, month, day))
    return utcDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    })
  }

  // Función auxiliar para formatear hora
  // Usa UTC para mantener la hora original
  const formatTime = (fechaHora: string): string => {
    const date = new Date(fechaHora)
    return date.toLocaleTimeString("es-ES", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: "UTC"
    })
  }

  useEffect(() => {
    const fetchMovie = async () => {
      const movieId = params.id as string
      
      if (!movieId) {
        setError('ID de película no válido')
        setIsLoading(false)
        return
      }

      if (!token) {
        setError('Debes iniciar sesión para ver los detalles de la película')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Cargar película primero (secuencial para evitar conexiones simultáneas)
        const pelicula = await movieService.getById(movieId, token)
        
        // Luego cargar funciones (después de que la primera petición termine)
        const funcionesData = await functionService.getByMovieId(movieId, token)

        const example = funcionesData
        console.log(example)
        
        // Mapear la película para asegurar que tenga el formato correcto
        const mappedMovie: Pelicula = {
          id_pelicula: pelicula.id_pelicula,
          titulo: pelicula.titulo || '',
          genero: pelicula.genero || '',
          descripcion: pelicula.descripcion || '',
          clasificacion: pelicula.clasificacion || '',
          duracion: typeof pelicula.duracion === 'string' 
            ? parseInt(pelicula.duracion) || 0 
            : pelicula.duracion || 0,
          imagen_url: pelicula.image_url || pelicula.imagen_url || '',
        }
        
        setMovie(mappedMovie)

        // Mapear funciones al formato esperado
        const mappedFunciones: Funcion[] = funcionesData.map((f: any) => ({
          id_funcion: f.id_funcion,
          id_pelicula: f.id_pelicula,
          id_sala: f.id_sala,
          fecha_hora: f.fecha_hora,
          precio: typeof f.precio === 'string' ? parseFloat(f.precio) : f.precio || 0,
        }))

        setFunciones(mappedFunciones)
        const newFunciones = mappedFunciones
        console.log(newFunciones)

        // Extraer fechas únicas disponibles
        const uniqueDates = Array.from(
          new Set(mappedFunciones.map(f => extractDate(f.fecha_hora)))
        ).sort() // Ordenar fechas cronológicamente

        setAvailableDates(uniqueDates)
      } catch (err) {
        console.error('Error al cargar la película:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar la información de la película')
        setMovie(null)
        setFunciones([])
        setAvailableDates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovie()
  }, [params.id, token])

  // Efecto para filtrar funciones cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && funciones.length > 0) {
      const funcionesFiltradas = funciones.filter(f => 
        extractDate(f.fecha_hora) === selectedDate
      )
      // Ordenar por hora
      funcionesFiltradas.sort((a, b) => 
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      )
      setFuncionesForDate(funcionesFiltradas)
      // Limpiar selección de función cuando cambia la fecha
      setSelectedFuncion("")
    } else {
      setFuncionesForDate([])
    }
  }, [selectedDate, funciones])

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

  if (error || !movie) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md space-y-4 text-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error || 'No se pudo cargar la información de la película.'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la cartelera
            </Button>
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
                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{movie.descripcion}</p>
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
                        {availableDates.length === 0 ? (
                          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                            No hay funciones disponibles para esta película
                          </div>
                        ) : (
                          <Select value={selectedDate} onValueChange={setSelectedDate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Elige una fecha" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDates.map((date) => (
                                <SelectItem key={date} value={date}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateSpanish(date)}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Time Selector */}
                      {selectedDate && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">
                            Selecciona un horario
                          </label>
                          {funcionesForDate.length === 0 ? (
                            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                              No hay horarios disponibles para esta fecha
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {funcionesForDate.map((funcion) => (
                                <Button
                                  key={funcion.id_funcion}
                                  variant={selectedFuncion === funcion.id_funcion ? "default" : "outline"}
                                  onClick={() => setSelectedFuncion(funcion.id_funcion)}
                                  className="h-auto flex-col gap-1 py-3"
                                >
                                  <span className="text-base font-semibold">{formatTime(funcion.fecha_hora)}</span>
                                  <span className="text-xs opacity-80">${funcion.precio.toFixed(2)}</span>
                                </Button>
                              ))}
                            </div>
                          )}
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
