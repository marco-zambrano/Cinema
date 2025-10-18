import { Armchair } from "lucide-react"

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-card">
          <Armchair className="h-4 w-4" />
        </div>
        <span className="text-muted-foreground">Disponible</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-primary bg-primary shadow-lg shadow-primary/50">
          <Armchair className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-muted-foreground">Seleccionado</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-destructive/50 bg-destructive/20 opacity-50">
          <Armchair className="h-4 w-4 text-destructive" />
        </div>
        <span className="text-muted-foreground">Ocupado</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-warning/50 bg-warning/20 opacity-50">
          <Armchair className="h-4 w-4 text-warning" />
        </div>
        <span className="text-muted-foreground">En Proceso</span>
      </div>
    </div>
  )
}
