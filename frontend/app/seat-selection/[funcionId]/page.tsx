"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SeatGrid } from "@/components/seats/seat-grid"
import { SeatLegend } from "@/components/seats/seat-legend"
import type { Asiento, Funcion, Pelicula, Sala } from "@/lib/types"
import { functionService } from "@/lib/api"
import { ArrowLeft, Armchair } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"

interface FuncionDetails {
  funcion: Funcion
  pelicula: Pelicula
  sala: Sala
}

export default function SeatSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken } = useAuth()
  const [funcionDetails, setFuncionDetails] = useState<FuncionDetails | null>(null)
  const [seats, setSeats] = useState<Asiento[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)

  // Función auxiliar para convertir número a letra de fila (1 -> A, 2 -> B, etc.)
  const numberToRowLetter = (num: number): string => {
    return String.fromCharCode(64 + num) // A=65, B=66, etc.
  }

  // Función auxiliar para convertir letra de fila a número (A=1, B=2, etc.)
  const rowLetterToNumber = (letter: string): number => {
    return letter.charCodeAt(0) - 64 // A=65, B=66, etc.
  }

  // Función auxiliar para generar asientos basados en filas y columnas
  const generateSeats = (sala: Sala): Asiento[] => {
    const asientos: Asiento[] = []
    
    for (let fila = 1; fila <= sala.filas; fila++) {
      const filaLetter = numberToRowLetter(fila)
      for (let columna = 1; columna <= sala.columnas; columna++) {
        // El número del asiento ahora es un string como "A1", "A2", etc.
        const numeroAsiento = `${filaLetter}${columna}`
        asientos.push({
          id_asiento: `${sala.id_sala}-${filaLetter}-${columna}`, // ID temporal basado en posición
          id_sala: sala.id_sala,
          fila: filaLetter,
          numero: numeroAsiento,
          estado: "disponible" as const,
        })
      }
    }
    
    return asientos
  }

  useEffect(() => {
    const fetchFuncionDetails = async () => {
      const funcionId = params.funcionId as string
      
      if (!funcionId) {
        setIsLoading(false)
        return
      }

      if (!accessToken) {
        router.push("/login")
        return
      }

      try {
        setIsLoading(true)
        
        // Obtener función con película y sala usando GraphQL
        const funcionData = await functionService.getByIdGraphQL(funcionId, accessToken)
        
        if (!funcionData) {
          throw new Error("No se pudo obtener la información de la función")
        }
        
        // Mapear la película
        const pelicula: Pelicula = {
          id_pelicula: funcionData.peliculas?.[0]?.id_pelicula || '',
          titulo: funcionData.peliculas?.[0]?.titulo || '',
          genero: funcionData.peliculas?.[0]?.genero || '',
          descripcion: funcionData.peliculas?.[0]?.descripcion || '',
          clasificacion: funcionData.peliculas?.[0]?.clasificacion || '',
          duracion: typeof funcionData.peliculas?.[0]?.duracion === 'string' 
            ? parseInt(funcionData.peliculas[0].duracion) || 0 
            : funcionData.peliculas?.[0]?.duracion || 0,
          imagen_url: funcionData.peliculas?.[0]?.image_url || '',
        }
        
        // Mapear la sala
        const sala: Sala = {
          id_sala: funcionData.salas?.[0]?.id_sala || '',
          nombre: funcionData.salas?.[0]?.nombre || '',
          capacidad: typeof funcionData.salas?.[0]?.capacidad === 'string'
            ? parseInt(funcionData.salas[0].capacidad) || 0
            : funcionData.salas?.[0]?.capacidad || 0,
          tipo: funcionData.salas?.[0]?.tipo || '',
          estado: funcionData.salas?.[0]?.estado || '',
          filas: typeof funcionData.salas?.[0]?.filas === 'string'
            ? parseInt(funcionData.salas[0].filas) || 0
            : funcionData.salas?.[0]?.filas || 0,
          columnas: typeof funcionData.salas?.[0]?.columnas === 'string'
            ? parseInt(funcionData.salas[0].columnas) || 0
            : funcionData.salas?.[0]?.columnas || 0,
        }
        
        // Mapear la función
        const funcion: Funcion = {
          id_funcion: funcionData.id_funcion,
          id_pelicula: pelicula.id_pelicula,
          id_sala: sala.id_sala,
          fecha_hora: funcionData.fecha_hora,
          precio: typeof funcionData.precio === 'string' 
            ? parseFloat(funcionData.precio) 
            : funcionData.precio || 0,
        }
        
        // Generar asientos basados en las filas y columnas de la sala
        const asientos = generateSeats(sala)
        
        // Obtener los asientos ocupados para esta función
        try {
          const occupiedSeatsData = await functionService.getOccupiedSeats(funcionId, accessToken)
          
          // Crear un mapa de números de asiento ocupados (ahora son strings como "A1", "A2", etc.)
          const occupiedSeatNumbers = new Set<string>()
          occupiedSeatsData.forEach((seat: any) => {
            if (seat.numero !== null && seat.numero !== undefined) {
              const seatNum = String(seat.numero)
              occupiedSeatNumbers.add(seatNum)
            }
          })
          
          // Marcar los asientos ocupados en el grid
          const asientosActualizados = asientos.map((asiento) => {
            if (occupiedSeatNumbers.has(asiento.numero)) {
              return { ...asiento, estado: "ocupado" as const }
            }
            return asiento
          })
          
          setSeats(asientosActualizados)
        } catch (error) {
          console.warn('No se pudieron cargar los asientos ocupados, mostrando todos como disponibles:', error)
          // Si hay error, mostrar todos los asientos como disponibles
          setSeats(asientos)
        }
        
        setFuncionDetails({
          funcion,
          pelicula,
          sala,
        })
      } catch (err) {
        console.error('Error al cargar los detalles de la función:', err)
        setFuncionDetails(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFuncionDetails()
  }, [params.funcionId, accessToken, router])

  const handleSeatClick = useCallback(
    (seatId: string) => {
      const seat = seats.find((s) => s.id_asiento === seatId)
      if (!seat) return

      // No permitir seleccionar asientos ocupados
      if (seat.estado === "ocupado") {
        return
      }

      // Si el asiento ya está seleccionado, deseleccionarlo
      if (selectedSeats.includes(seatId)) {
        setSelectedSeats((prev) => prev.filter((id) => id !== seatId))
        setSeats((prevSeats) =>
          prevSeats.map((s) =>
            s.id_asiento === seatId ? { ...s, estado: "disponible" } : s
          )
        )
        return
      }

      // Si ya se alcanzó el límite de boletos, no permitir más selecciones
      if (selectedSeats.length >= ticketCount) {
        return
      }

      // Seleccionar el asiento
      setSelectedSeats((prev) => [...prev, seatId])
      setSeats((prevSeats) =>
        prevSeats.map((s) =>
          s.id_asiento === seatId ? { ...s, estado: "seleccionado" } : s
        )
      )
    },
    [seats, selectedSeats, ticketCount]
  )

  const handleContinue = () => {
    if (!funcionDetails || selectedSeats.length !== ticketCount) {
      return
    }

    // Obtener los asientos seleccionados completos
    const selectedSeatsData = seats.filter((seat) =>
      selectedSeats.includes(seat.id_asiento)
    )

    // Guardar datos en sessionStorage para el checkout
    const reservationData = {
      funcionId: funcionDetails.funcion.id_funcion,
      seatIds: selectedSeats,
      ticketCount: ticketCount,
      // Guardar también toda la información necesaria para el checkout
      checkoutData: {
        funcion: funcionDetails.funcion,
        pelicula: funcionDetails.pelicula,
        sala: funcionDetails.sala,
        seats: selectedSeatsData,
      },
    }

    sessionStorage.setItem("reservation", JSON.stringify(reservationData))

    // Redirigir a checkout
    router.push("/checkout")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!funcionDetails) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Función no encontrada</h1>
            <Button onClick={() => router.push("/")}>Volver a la cartelera</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Calcular el total basado en los asientos seleccionados
  const totalPrice = funcionDetails.funcion.precio * (selectedSeats.length > 0 ? selectedSeats.length : ticketCount)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="mb-6">
            <h1 className="mb-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
              {funcionDetails.pelicula.titulo}
            </h1>
            <p className="text-muted-foreground">
              {(() => {
                const fechaHora = funcionDetails.funcion.fecha_hora
                // Si ya es un timestamp ISO completo, usarlo directamente
                const date = fechaHora.includes('T') 
                  ? new Date(fechaHora) 
                  : new Date(fechaHora + "T00:00:00")
                const fechaFormateada = date.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC"
                })
                const horaFormateada = date.toLocaleTimeString("es-ES", {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: "UTC"
                })
                return `${fechaFormateada} - ${horaFormateada} | Sala ${funcionDetails.sala.nombre}`
              })()}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Seat Selection Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {/* Ticket Count Input */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">Número de boletos</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={ticketCount}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value) || 1
                        const newCount = Math.max(1, Math.min(10, value))
                        setTicketCount(newCount)
                        // Clear selection if new count is less
                        if (selectedSeats.length > newCount) {
                          const seatsToDeselect = selectedSeats.slice(newCount)
                          setSelectedSeats((prev) => prev.slice(0, newCount))
                          // Actualizar el estado de los asientos deseleccionados
                          setSeats((prevSeats) =>
                            prevSeats.map((s) =>
                              seatsToDeselect.includes(s.id_asiento)
                                ? { ...s, estado: "disponible" }
                                : s
                            )
                          )
                        }
                      }}
                      className="w-32"
                    />
                  </div>

                  {/* Screen */}
                  <div className="mb-8">
                    <div className="mx-auto h-2 w-3/4 rounded-t-full bg-gradient-to-b from-primary/50 to-transparent" />
                    <p className="mt-2 text-center text-sm text-muted-foreground">PANTALLA</p>
                  </div>

                  {/* Seat Grid */}
                  <SeatGrid seats={seats} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} />

                  {/* Legend */}
                  <div className="mt-8">
                    <SeatLegend />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-xl font-bold text-foreground">Resumen</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Boletos seleccionados</p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedSeats.length} / {ticketCount}
                      </p>
                    </div>

                    {selectedSeats.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm text-muted-foreground">Asientos</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSeats.map((seatId) => {
                            const seat = seats.find((s) => s.id_asiento === seatId)
                            if (!seat) return null
                            return (
                              <div
                                key={seatId}
                                className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                              >
                                <Armchair className="h-3 w-3" />
                                {seat.numero}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio por boleto</span>
                        <span className="font-medium text-foreground">${funcionDetails.funcion.precio.toFixed(2)}</span>
                      </div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Cantidad</span>
                        <span className="font-medium text-foreground">{ticketCount} boleto(s)</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleContinue}
                      disabled={selectedSeats.length !== ticketCount}
                      className="w-full"
                      size="lg"
                    >
                      Continuar al Pago
                    </Button>

                    {selectedSeats.length !== ticketCount && (
                      <p className="text-center text-xs text-muted-foreground">
                        Selecciona {ticketCount - selectedSeats.length} asiento(s) más
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
