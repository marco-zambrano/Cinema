'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { isTokenValid, isTokenExpired } from '@/lib/jwt-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string // ej: 'admin', 'cliente'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, accessToken, logout } = useAuth()
  const router = useRouter()
  const [isValidated, setIsValidated] = useState(false)

  useEffect(() => {
    const validateAccess = async () => {
      // Esperar a que termine de cargar
      if (isLoading) return

      // 1. Verificar si está autenticado
      if (!user || !accessToken) {
        console.log('[ProtectedRoute] No user or token, redirecting to login')
        router.push('/login')
        return
      }

      // 2. Validar que el token no esté expirado (validación local)
      if (isTokenExpired(accessToken)) {
        console.log('[ProtectedRoute] Token expired, logging out')
        await logout()
        router.push('/login')
        return
      }

      // 3. Validar que el token sea válido
      if (!isTokenValid(accessToken)) {
        console.log('[ProtectedRoute] Invalid token')
        await logout()
        router.push('/login')
        return
      }

      // 4. Verificar rol si es requerido
      if (requiredRole && user.rol !== requiredRole) {
        console.log(`[ProtectedRoute] User role '${user.rol}' does not match required role '${requiredRole}'`)
        router.push('/') // Redirigir a home o página de acceso denegado
        return
      }

      // Si todo está bien, permitir acceso
      setIsValidated(true)
    }

    validateAccess()
  }, [user, isLoading, accessToken, requiredRole, router, logout])

  // Mostrar loading mientras se valida
  if (isLoading || !isValidated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // No renderizar si no está validado
  if (!user || !accessToken) {
    return null
  }

  return <>{children}</>
}
