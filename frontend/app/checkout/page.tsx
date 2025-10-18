"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import type { Movie, Funcion, Sala, Asiento } from "@/lib/types"
import { Calendar, Clock, MapPin, CreditCard, Armchair, CheckCircle2 } from "lucide-react"

interface ReservationData {
  funcionId: string
  seatIds: string[]
  ticketCount: number
}

interface CheckoutData {
  funcion: Funcion
  movie: Movie
  sala: Sala
  seats: Asiento[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get reservation data from sessionStorage
    const storedData = sessionStorage.getItem("reservation")
    if (!storedData) {
      router.push("/")
      return
    }

    const data: ReservationData = JSON.parse(storedData)
    setReservationData(data)

    // Fetch checkout details
    const fetchCheckoutData = async () => {
      try {
        const response = await fetch(`/api/checkout/${data.funcionId}?seatIds=${data.seatIds.join(",")}`)
        const checkoutInfo = await response.json()
        setCheckoutData(checkoutInfo)
      } catch (error) {
        console.error("Error fetching checkout data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCheckoutData()
  }, [router])

  const handleConfirmPayment = async () => {
    if (!reservationData || !checkoutData || !user) return

    setIsProcessing(true)

    try {
      // Create reservation
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          id_funcion: reservationData.funcionId,
          seat_ids: reservationData.seatIds,
          payment_method: paymentMethod,
          total: checkoutData.funcion.precio * reservationData.ticketCount,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al procesar la reserva")
      }

      const result = await response.json()

      // Clear reservation data
      sessionStorage.removeItem("reservation")

      // Redirect to success page
      router.push(`/checkout/success?reservationId=${result.reserva.id_reserva}`)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Error al procesar el pago. Por favor intenta nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!reservationData || !checkoutData) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">No hay reserva activa</h1>
            <Button onClick={() => router.push("/")}>Volver a la cartelera</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const total = checkoutData.funcion.precio * reservationData.ticketCount

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-balance text-3xl font-bold text-foreground md:text-4xl">Resumen de Reserva</h1>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la Función</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Movie Info */}
                  <div>
                    <h3 className="mb-2 text-xl font-bold text-foreground">{checkoutData.movie.titulo}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(checkoutData.funcion.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{checkoutData.funcion.hora}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{checkoutData.sala.nombre}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Selected Seats */}
                  <div>
                    <h4 className="mb-3 font-semibold text-foreground">Asientos Seleccionados</h4>
                    <div className="flex flex-wrap gap-2">
                      {checkoutData.seats.map((seat) => (
                        <div
                          key={seat.id_asiento}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2"
                        >
                          <Armchair className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {seat.fila}
                            {seat.numero}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <h4 className="mb-3 font-semibold text-foreground">Método de Pago</h4>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                          <RadioGroupItem value="credit-card" id="credit-card" />
                          <Label htmlFor="credit-card" className="flex flex-1 cursor-pointer items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">Tarjeta de Crédito/Débito</p>
                              <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal" className="flex flex-1 cursor-pointer items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                              P
                            </div>
                            <div>
                              <p className="font-medium text-foreground">PayPal</p>
                              <p className="text-sm text-muted-foreground">Paga con tu cuenta PayPal</p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex flex-1 cursor-pointer items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                              $
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Efectivo en Taquilla</p>
                              <p className="text-sm text-muted-foreground">Paga al recoger tus boletos</p>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Total a Pagar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boletos ({reservationData.ticketCount})</span>
                      <span className="font-medium text-foreground">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precio por boleto</span>
                      <span className="font-medium text-foreground">${checkoutData.funcion.precio.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>

                  <Button onClick={handleConfirmPayment} disabled={isProcessing} className="w-full" size="lg">
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirmar Pago
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Al confirmar, aceptas nuestros términos y condiciones
                  </p>
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
