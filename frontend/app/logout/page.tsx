'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const { logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        // El logout redirige automáticamente a /login
        // pero lo hacemos explícito para asegurar la redirección
        router.push('/login')
      } catch (error) {
        console.error('Error during logout:', error)
        // Incluso si hay error, redirigir al login
        router.push('/login')
      }
    }

    performLogout()
  }, [logout, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Cerrando sesión...</p>
      </div>
    </div>
  )
}
