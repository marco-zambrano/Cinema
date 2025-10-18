"use client"

import { cn } from "@/lib/utils"
import type { Asiento } from "@/lib/types"
import { Armchair } from "lucide-react"

interface SeatGridProps {
  seats: Asiento[]
  selectedSeats: string[]
  onSeatClick: (seatId: string) => void
}

export function SeatGrid({ seats, selectedSeats, onSeatClick }: SeatGridProps) {
  // Group seats by row
  const seatsByRow = seats.reduce(
    (acc, seat) => {
      if (!acc[seat.fila]) {
        acc[seat.fila] = []
      }
      acc[seat.fila].push(seat)
      return acc
    },
    {} as Record<string, Asiento[]>,
  )

  const rows = Object.keys(seatsByRow).sort()

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <span className="w-8 text-center text-sm font-medium text-muted-foreground">{row}</span>
          <div className="flex flex-1 flex-wrap justify-center gap-2">
            {seatsByRow[row]
              .sort((a, b) => a.numero - b.numero)
              .map((seat) => {
                const isSelected = selectedSeats.includes(seat.id_asiento)
                const isAvailable = seat.estado === "disponible"
                const isOccupied = seat.estado === "ocupado"
                const isInProcess = seat.estado === "en-proceso" && !isSelected

                return (
                  <button
                    key={seat.id_asiento}
                    onClick={() => onSeatClick(seat.id_asiento)}
                    disabled={isOccupied || isInProcess}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100",
                      isSelected && "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/50",
                      isAvailable && !isSelected && "border-border bg-card text-foreground hover:border-primary/50",
                      isOccupied && "border-destructive/50 bg-destructive/20 text-destructive opacity-50",
                      isInProcess && "border-warning/50 bg-warning/20 text-warning opacity-50",
                    )}
                    title={`${row}${seat.numero} - ${seat.estado}`}
                  >
                    <Armchair className="h-5 w-5" />
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
