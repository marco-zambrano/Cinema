"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download, Home } from "lucide-react"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservationId = searchParams.get("reservationId")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!reservationId) {
      router.push("/")
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [reservationId, router])

  if (!reservationId) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 lg:px-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center md:p-12">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h1 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">Reserva Confirmada</h1>

            <p className="mb-8 text-pretty text-lg text-muted-foreground">
              Tu reserva ha sido procesada exitosamente. Recibirás un correo de confirmación con los detalles de tu
              compra.
            </p>

            <div className="mb-8 rounded-lg bg-muted/50 p-6">
              <p className="mb-2 text-sm text-muted-foreground">Número de Reserva</p>
              <p className="text-2xl font-bold text-foreground">{reservationId}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push("/orders")} size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Ver Mis Boletos
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" size="lg" className="gap-2">
                <Home className="h-5 w-5" />
                Volver al Inicio
              </Button>
            </div>

            {countdown > 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                Serás redirigido a tus boletos en {countdown} segundo{countdown !== 1 ? "s" : ""}...
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
