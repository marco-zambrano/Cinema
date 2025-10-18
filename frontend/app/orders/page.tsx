"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Reserva, Factura, Movie, Funcion } from "@/lib/types"
import { Calendar, Clock, MapPin, Armchair, Receipt, CreditCard } from "lucide-react"

interface OrderWithDetails extends Reserva {
  movie: Movie
  funcion: Funcion
  factura: Factura
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/orders?userId=${user.id_usuario}`)
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user])

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
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="mb-2 text-balance text-3xl font-bold text-foreground md:text-4xl">Mis Boletos</h1>
            <p className="text-pretty text-lg text-muted-foreground">Historial de tus reservas y compras</p>
          </div>

          {isLoadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">No tienes reservas</h3>
                <p className="text-muted-foreground">Cuando realices una reserva, aparecerá aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id_reserva}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl">{order.movie.titulo}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">Reserva #{order.id_reserva.split("-")[1]}</p>
                      </div>
                      <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
                        Confirmado
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Function Details */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Fecha</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.funcion.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Hora</p>
                          <p className="text-sm text-muted-foreground">{order.funcion.hora}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Sala</p>
                          <p className="text-sm text-muted-foreground">Sala {order.funcion.id_sala.replace("s", "")}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Seats */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Armchair className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium text-foreground">Asientos ({order.asientos.length})</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.asientos.map((seat) => (
                          <div
                            key={seat.id_asiento}
                            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                          >
                            {seat.fila}
                            {seat.numero}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Info */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Método de Pago</p>
                          <p className="text-sm capitalize text-muted-foreground">
                            {order.factura.metodo_pago.replace("-", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted-foreground">Total Pagado</p>
                        <p className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Reservation Date */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">
                        Reservado el{" "}
                        {new Date(order.fecha_reserva).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
