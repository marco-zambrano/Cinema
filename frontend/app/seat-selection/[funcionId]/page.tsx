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
import type { Asiento, Funcion, Movie, Sala } from "@/lib/types"
import { ArrowLeft, Armchair } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"

interface FuncionDetails {
  funcion: Funcion
  movie: Movie
  sala: Sala
}

export default function SeatSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [funcionDetails, setFuncionDetails] = useState<FuncionDetails | null>(null)
  const [seats, setSeats] = useState<Asiento[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)

  // WebSocket connection for real-time seat updates
  const { sendMessage, lastMessage } = useWebSocket(`/api/seats/ws?funcionId=${params.funcionId}`)

  useEffect(() => {
    const fetchFuncionDetails = async () => {
      try {
        const response = await fetch(`/api/funciones/${params.funcionId}`)
        const data = await response.json()
        setFuncionDetails(data)
        setSeats(data.seats)
      } catch (error) {
        console.error("Error fetching funcion details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFuncionDetails()
  }, [params.funcionId])

  // Handle WebSocket messages for real-time seat updates
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage)

      if (data.type === "seat-update") {
        setSeats((prevSeats) =>
          prevSeats.map((seat) => (seat.id_asiento === data.seatId ? { ...seat, estado: data.estado } : seat)),
        )
      } else if (data.type === "seat-released") {
        setSeats((prevSeats) =>
          prevSeats.map((seat) => (seat.id_asiento === data.seatId ? { ...seat, estado: "disponible" } : seat)),
        )
      }
    }
  }, [lastMessage])

  const handleSeatClick = useCallback(
    (seatId: string) => {
      const seat = seats.find((s) => s.id_asiento === seatId)
      if (!seat) return

      // Can't select occupied or in-process (by others) seats
      if (seat.estado === "ocupado" || (seat.estado === "en-proceso" && !selectedSeats.includes(seatId))) {
        return
      }

      if (selectedSeats.includes(seatId)) {
        // Deselect seat
        setSelectedSeats((prev) => prev.filter((id) => id !== seatId))
        sendMessage(
          JSON.stringify({
            type: "release-seat",
            seatId,
            userId: user?.id_usuario,
          }),
        )
      } else {
        // Check if we can select more seats
        if (selectedSeats.length >= ticketCount) {
          return
        }

        // Try to select seat
        sendMessage(
          JSON.stringify({
            type: "select-seat",
            seatId,
            userId: user?.id_usuario,
          }),
        )

        // Optimistically update UI
        setSelectedSeats((prev) => [...prev, seatId])
        setSeats((prevSeats) => prevSeats.map((s) => (s.id_asiento === seatId ? { ...s, estado: "seleccionado" } : s)))
      }
    },
    [seats, selectedSeats, ticketCount, sendMessage, user],
  )

  const handleContinue = () => {
    if (selectedSeats.length === ticketCount) {
      // Store selection in sessionStorage for checkout
      sessionStorage.setItem(
        "reservation",
        JSON.stringify({
          funcionId: params.funcionId,
          seatIds: selectedSeats,
          ticketCount,
        }),
      )
      router.push("/checkout")
    }
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

  const totalPrice = funcionDetails.funcion.precio * ticketCount

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
              {funcionDetails.movie.titulo}
            </h1>
            <p className="text-muted-foreground">
              {new Date(funcionDetails.funcion.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              - {funcionDetails.funcion.hora} | Sala {funcionDetails.sala.nombre}
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
                        setTicketCount(Math.max(1, Math.min(10, value)))
                        // Clear selection if new count is less
                        if (selectedSeats.length > value) {
                          const toRemove = selectedSeats.slice(value)
                          toRemove.forEach((seatId) => {
                            sendMessage(
                              JSON.stringify({
                                type: "release-seat",
                                seatId,
                                userId: user?.id_usuario,
                              }),
                            )
                          })
                          setSelectedSeats((prev) => prev.slice(0, value))
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
                            return (
                              <div
                                key={seatId}
                                className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                              >
                                <Armchair className="h-3 w-3" />
                                {seat?.fila}
                                {seat?.numero}
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
