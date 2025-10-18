export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">CineMax</h3>
            <p className="text-pretty text-sm text-muted-foreground">
              Tu destino para reservar boletos de cine de manera fácil y rápida.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Contacto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: info@cinemax.com</li>
              <li>Teléfono: +1 234 567 890</li>
              <li>Dirección: Av. Principal 123</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Horarios</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Lunes - Viernes: 10:00 - 23:00</li>
              <li>Sábado - Domingo: 09:00 - 00:00</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CineMax. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
