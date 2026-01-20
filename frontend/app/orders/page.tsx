"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Reserva, Factura, Pelicula, Funcion } from "@/lib/types"
import { Calendar, Clock, MapPin, Armchair, Receipt, CreditCard } from "lucide-react"
import { reservationService, facturaService } from "@/lib/api"

interface OrderWithDetails extends Reserva {
  pelicula: Pelicula
  funcion: Funcion & {
    salas?: Array<{
      id_sala: string
      nombre: string
      capacidad: number
      tipo: string
      estado: string
      filas: number
      columnas: number
    }>
  }
  factura: Factura
  asientos?: Array<{
    id_asiento: string
    numero: string
    estado: string
  }>
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isLoading, accessToken } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !accessToken || !user.id_usuario) {
        setIsLoadingOrders(false)
        return
      }

      try {
        setIsLoadingOrders(true)

        // Obtener reservas del usuario usando GraphQL
        const reservasData = await reservationService.getByUserIdGraphQL(user.id_usuario, accessToken)

        // console.log("reservasData", reservasData)

        // Obtener todas las facturas para buscar las correspondientes
        let facturasMap: Map<string, Factura> = new Map()
        try {
          const facturas = await facturaService.getAll(accessToken)
          facturas.forEach((factura: Factura) => {
            if (factura.id_reserva) {
              facturasMap.set(factura.id_reserva, factura)
            }
          })
        } catch (error) {
          console.warn("No se pudieron cargar las facturas:", error)
        }

        // Mapear las reservas al formato esperado
        const ordersData: OrderWithDetails[] = reservasData.map((reserva: any) => {
          // Mapear película
          const pelicula: Pelicula = {
            id_pelicula: reserva.pelicula?.id_pelicula || '',
            titulo: reserva.pelicula?.titulo || '',
            genero: reserva.pelicula?.genero || '',
            descripcion: reserva.pelicula?.descripcion || '',
            clasificacion: reserva.pelicula?.clasificacion || '',
            duracion: typeof reserva.pelicula?.duracion === 'string' 
              ? parseInt(reserva.pelicula.duracion) || 0 
              : reserva.pelicula?.duracion || 0,
            imagen_url: reserva.pelicula?.image_url || '',
          }

          // Mapear función
          const funcion: Funcion & {
            salas?: Array<{
              id_sala: string
              nombre: string
              capacidad: number
              tipo: string
              estado: string
              filas: number
              columnas: number
            }>
          } = {
            id_funcion: reserva.funcion?.id_funcion || reserva.id_funcion || '',
            id_pelicula: pelicula.id_pelicula,
            id_sala: reserva.funcion?.salas?.[0]?.id_sala || '',
            fecha_hora: reserva.funcion?.fecha_hora || '',
            precio: typeof reserva.funcion?.precio === 'string' 
              ? parseFloat(reserva.funcion.precio) 
              : reserva.funcion?.precio || 0,
            salas: reserva.funcion?.salas || [],
          }

          // Obtener factura asociada o crear una factura por defecto
          const factura = facturasMap.get(reserva.id_reserva) || {
            id_factura: '',
            id_reserva: reserva.id_reserva,
            total: typeof reserva.total === 'string' ? parseFloat(reserva.total) : reserva.total || 0,
            metodo_pago: 'No especificado',
            fecha_emision: reserva.fecha_reserva || new Date().toISOString(),
          }

          // Mapear asientos
          const asientos = reserva.asientos?.map((asiento: any) => ({
            id_asiento: asiento.id_asiento,
            numero: asiento.numero || '',
            estado: asiento.estado || 'disponible'
          })) || []

          return {
            id_reserva: reserva.id_reserva,
            id_usuario: reserva.id_usuario || user.id_usuario,
            id_funcion: funcion.id_funcion,
            fecha_reserva: reserva.fecha_reserva || new Date().toISOString(),
            total: typeof reserva.total === 'string' ? parseFloat(reserva.total) : reserva.total || 0,
            cantidad_asientos: typeof reserva.cantidad_asientos === 'string' 
              ? parseInt(reserva.cantidad_asientos) 
              : reserva.cantidad_asientos || 0,
            estado: reserva.estado || 'confirmada',
            pelicula,
            funcion,
            factura,
            asientos,
          }
        })

        
        setOrders(ordersData)
        const newData = ordersData 
        console.log("newData", newData)
      } catch (error) {
        console.error('Error al cargar las reservas:', error)
        setOrders([])
      } finally {
        setIsLoadingOrders(false)
      }
    }

    fetchOrders()
  }, [user, accessToken, router])

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
            <h1 className="mb-2 text-balance text-3xl font-bold text-foreground md:text-4xl">Mis Reservas</h1>
            <p className="text-pretty text-lg text-muted-foreground">Historial de tus reservas</p>
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
                        <CardTitle className="text-2xl">{order.pelicula.titulo}</CardTitle>
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
                            {(() => {
                              const fechaHora = order.funcion.fecha_hora
                              const date = fechaHora.includes('T') 
                                ? new Date(fechaHora) 
                                : new Date(fechaHora + "T00:00:00")
                              return date.toLocaleDateString("es-ES", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "UTC"
                              })
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Hora</p>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const fechaHora = order.funcion.fecha_hora
                              const date = fechaHora.includes('T') 
                                ? new Date(fechaHora) 
                                : new Date(fechaHora + "T00:00:00")
                              return date.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "UTC"
                              })
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Sala</p>
                          <p className="text-sm text-muted-foreground">
                            {order.funcion.salas?.[0]?.nombre || `Sala ${order.funcion.id_sala}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Seats */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Armchair className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium text-foreground">Asientos ({order.cantidad_asientos})</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.asientos && order.asientos.length > 0 ? (
                          order.asientos.map((asiento) => (
                            <div
                              key={asiento.id_asiento}
                              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                            >
                              {asiento.numero}
                            </div>
                          ))
                        ) : (
                          // Fallback si no se pudieron cargar los asientos
                          Array.from({ length: order.cantidad_asientos }).map((_, index) => (
                            <div
                              key={index}
                              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                            >
                              {index + 1}
                            </div>
                          ))
                        )}
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
