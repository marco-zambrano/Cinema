"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Film, Ticket, LogOut } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">CineMax</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link href="/orders">
                <Button variant="ghost" className="gap-2">
                  <Ticket className="h-4 w-4" />
                  <span className="hidden sm:inline">Mis Boletos</span>
                </Button>
              </Link>

              <Button variant="ghost" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
