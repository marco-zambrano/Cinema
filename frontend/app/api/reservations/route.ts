import { NextResponse } from "next/server"
import type { Reserva, Factura } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id_usuario, id_funcion, seat_ids, payment_method, total } = body

    // Generate IDs
    const reservaId = `RES-${Date.now()}`
    const facturaId = `FAC-${Date.now()}`

    // Create reservation
    const reserva: Reserva = {
      id_reserva: reservaId,
      id_usuario,
      id_funcion,
      fecha_reserva: new Date().toISOString(),
      total,
      asientos: seat_ids.map((id: string) => ({
        id_asiento: id,
        id_sala: id.split("-")[0],
        fila: id.split("-")[1].charAt(0),
        numero: Number.parseInt(id.split("-")[1].slice(1)),
        estado: "ocupado",
      })),
    }

    // Create factura
    const factura: Factura = {
      id_factura: facturaId,
      id_reserva: reservaId,
      total,
      metodo_pago: payment_method,
      fecha: new Date().toISOString(),
    }

    // In a real app, save to database here
    console.log("Created reservation:", reserva)
    console.log("Created factura:", factura)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return NextResponse.json({
      reserva,
      factura,
      message: "Reserva creada exitosamente",
    })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 })
  }
}
