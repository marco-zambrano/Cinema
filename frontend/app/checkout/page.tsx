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
import type { Pelicula, Funcion, Sala, Asiento } from "@/lib/types"
import { Calendar, Clock, MapPin, CreditCard, Armchair, CheckCircle2, AlertCircle } from "lucide-react"
import { seatService, reservationService, facturaService } from "@/lib/api"
import { authService } from "@/lib/auth-service"

interface ReservationData {
  funcionId: string
  seatIds: string[]
  ticketCount: number
  checkoutData: {
    funcion: Funcion
    pelicula: Pelicula
    sala: Sala
    seats: Asiento[]
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user, accessToken } = useAuth()
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get reservation data from sessionStorage
    const storedData = sessionStorage.getItem("reservation")
    if (!storedData) {
      router.push("/")
      return
    }

    try {
      const data: ReservationData = JSON.parse(storedData)
      
      // Validar que los datos estén completos
      if (!data.checkoutData || !data.funcionId || !data.seatIds || !data.ticketCount) {
        console.error("Datos de reserva incompletos")
        router.push("/")
        return
      }

      setReservationData(data)
    } catch (error) {
      console.error("Error al parsear datos de reserva:", error)
      router.push("/")
      return
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Función auxiliar para convertir letra de fila a número (A=1, B=2, etc.)
  const rowLetterToNumber = (letter: string): number => {
    return letter.charCodeAt(0) - 64 // A=65, B=66, etc.
  }

  // Ya no necesitamos calculateSeatNumber porque numero ahora es un string como "A1", "A2", etc.

  const handleConfirmPayment = async () => {
    if (!reservationData || !user || !accessToken) {
      setError("No hay información suficiente para procesar el pago")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { checkoutData, seatIds, ticketCount, funcionId } = reservationData
      const { sala, seats } = checkoutData

      // Paso 1: Obtener el ID del usuario (obtener del perfil si no está disponible)
      let idUsuario = user.id_usuario
      
      // Si el usuario no tiene id_usuario, obtenerlo del perfil
      if (!idUsuario || idUsuario.trim() === '') {
        try {
          const profile = await authService.getProfile(accessToken)
          console.log("profile", profile)
          idUsuario = profile.id_usuario || ''
          
          if (!idUsuario || idUsuario.trim() === '') {
            throw new Error("No se pudo obtener el ID del usuario desde el perfil")
          }
        } catch (error) {
          console.error("Error al obtener el perfil del usuario:", error)
          setError("Error al obtener la información del usuario. Por favor, intenta iniciar sesión nuevamente.")
          setIsProcessing(false)
          return
        }
      }

      // Paso 2: Obtener todos los asientos de la sala para verificar cuáles existen
      let existingSeats: any[] = []
      try {
        const allSeats = await seatService.getAll(accessToken)
        // Filtrar solo los asientos de esta sala
        existingSeats = allSeats.filter((s: any) => s.id_sala === sala.id_sala)
      } catch (error) {
        console.warn("No se pudieron obtener los asientos existentes, continuando...", error)
      }

      // Paso 3: Crear o obtener los asientos seleccionados
      const processedSeats = []
      for (const seatId of seatIds) {
        const seat = seats.find((s) => s.id_asiento === seatId)
        if (!seat) {
          throw new Error(`Asiento ${seatId} no encontrado`)
        }

        // El número del asiento ahora es un string como "A1", "A2", etc.
        const seatNumber = seat.numero

        // Buscar si el asiento ya existe por número y sala
        let existingSeat = existingSeats.find(
          (s: any) => String(s.numero) === String(seatNumber)
        )

        if (existingSeat) {
          // Si el asiento existe, actualizar su estado a "ocupado"
          try {
            const updatedSeat = await seatService.update(
              existingSeat.id_asiento,
              {
                estado: "ocupado",
              },
              accessToken
            )
            processedSeats.push(updatedSeat || existingSeat)
          } catch (error) {
            console.warn(`No se pudo actualizar el asiento ${existingSeat.id_asiento}, usando el existente`, error)
            processedSeats.push(existingSeat)
          }
        } else {
          // Si el asiento no existe, crearlo
          try {
            const createdSeat = await seatService.create(
              {
                numero: seatNumber,
                estado: "ocupado",
                id_sala: sala.id_sala,
              },
              accessToken
            )
            processedSeats.push(createdSeat)
          } catch (error) {
            console.error(`Error al crear asiento ${seatId}:`, error)
            throw new Error(
              `Error al crear el asiento ${seat.numero}: ${
                error instanceof Error ? error.message : "Error desconocido"
              }`
            )
          }
        }
      }

      // Paso 4: Crear la reserva
      const fechaReserva = new Date().toISOString()
      const total = checkoutData.funcion.precio * ticketCount

      const reservation = await reservationService.create(
        {
          cantidad_asientos: ticketCount,
          estado: "confirmada",
          id_funcion: funcionId,
          id_usuario: idUsuario,
          total: total,
          fecha_reserva: fechaReserva,
        },
        accessToken
      )

      // Paso 5: Vincular los asientos con la reserva (crear relaciones en reserva_asiento)
      for (let i = 0; i < processedSeats.length; i++) {
        const processedSeat = processedSeats[i]
        const seatId = processedSeat.id_asiento || processedSeat.id
        if (!seatId) {
          console.error("Asiento sin ID:", processedSeat)
          continue
        }

        // Obtener la información del asiento original para mensajes de error
        const originalSeat = seats.find((s) => {
          return String(s.numero) === String(processedSeat.numero)
        })

        try {
          await reservationService.addSeat(
            reservation.id_reserva,
            seatId,
            accessToken
          )
        } catch (error: any) {
          // Si el error es que el asiento ya está en la reserva, continuar
          if (error?.message?.includes("ya está en esta reserva")) {
            console.warn(`Asiento ${seatId} ya está vinculado a la reserva`)
            continue
          }
          // Si el error es que el asiento ya está en otra reserva, es un problema
          if (error?.message?.includes("ya está reservado en otra reserva")) {
            const seatInfo = originalSeat ? `${originalSeat.fila}${originalSeat.numero}` : seatId
            throw new Error(
              `El asiento ${seatInfo} ya está reservado. Por favor, selecciona otros asientos.`
            )
          }
          console.error(`Error al vincular asiento ${seatId} con la reserva:`, error)
          const seatInfo = originalSeat ? `${originalSeat.fila}${originalSeat.numero}` : seatId
          throw new Error(
            `Error al vincular el asiento ${seatInfo} con la reserva: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          )
        }
      }

      // Paso 6: Crear la factura
      const fechaEmision = new Date().toISOString()
      // Mapear el método de pago a un formato más descriptivo
      const metodoPagoMap: Record<string, string> = {
        "credit-card": "Tarjeta de Crédito/Débito",
        "paypal": "PayPal",
        "cash": "Efectivo en Taquilla"
      }
      const metodoPagoDescriptivo = metodoPagoMap[paymentMethod] || paymentMethod

      try {
        const factura = await facturaService.create(
          {
            fecha_emision: fechaEmision,
            total: total,
            metodo_pago: metodoPagoDescriptivo,
            id_reserva: reservation.id_reserva,
          },
          accessToken
        )
        console.log("Factura creada exitosamente:", factura)
      } catch (error) {
        console.error("Error al crear la factura:", error)
        // No lanzar error, ya que la reserva se creó exitosamente
        // La factura puede crearse después manualmente si es necesario
        console.warn("La reserva se creó pero no se pudo generar la factura. Se puede crear manualmente después.")
      }

      // Paso 7: Limpiar los datos de sesión
      sessionStorage.removeItem("reservation")

      // Paso 8: Redirigir a la página de éxito con el ID de la reserva
      router.push(`/checkout/success?reservationId=${reservation.id_reserva}`)
    } catch (error) {
      console.error("Error al procesar el pago:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Error al procesar el pago. Por favor intenta nuevamente."
      )
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

  if (!reservationData || !reservationData.checkoutData) {
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

  const { checkoutData } = reservationData
  const total = checkoutData.funcion.precio * reservationData.ticketCount

  // Función auxiliar para extraer solo la fecha (YYYY-MM-DD) de un timestamp
  const extractDate = (fechaHora: string): string => {
    if (fechaHora.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fechaHora
    }
    if (fechaHora.includes('T')) {
      return fechaHora.split('T')[0]
    }
    const date = new Date(fechaHora)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Función auxiliar para formatear fecha en español
  const formatDateSpanish = (dateString: string): string => {
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
  const formatTime = (fechaHora: string): string => {
    const date = new Date(fechaHora)
    return date.toLocaleTimeString("es-ES", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: "UTC"
    })
  }

  const fechaHora = checkoutData.funcion.fecha_hora
  const fecha = extractDate(fechaHora)
  const fechaFormateada = formatDateSpanish(fecha)
  const horaFormateada = formatTime(fechaHora)

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
                    <h3 className="mb-2 text-xl font-bold text-foreground">{checkoutData.pelicula.titulo}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{fechaFormateada}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{horaFormateada}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Sala: {checkoutData.sala.nombre}</span>
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

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">{error}</p>
                      </div>
                    </div>
                  )}
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
                      <span className="text-muted-foreground">Boletos ( {reservationData.ticketCount} )</span>
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
