"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Film, Ticket, LogOut, LogIn, UserPlus, LayoutGrid } from "lucide-react"

export function Header() {
  const { user, logout, isLoading } = useAuth()

  // Mostrar un esqueleto de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky px-5 top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between w-full">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CineMax</span>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {user.rol === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Administrar</span>
                    </Button>
                  </Link>
              )}
              <Link href="/orders">
                <Button variant="ghost" className="gap-2">
                  <Ticket className="h-4 w-4" />
                  <span className="hidden sm:inline">Mis Reservas</span>
                </Button>
              </Link>

              <Button variant="ghost" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>

              <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Registrarse</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
