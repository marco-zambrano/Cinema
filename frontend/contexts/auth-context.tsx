"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { authService } from "@/lib/auth-service"
import {
  decodeToken,
  isTokenExpired,
  isTokenValid,
  shouldRefreshToken,
  getUserFromToken,
  getTokenExpiresIn,
} from "@/lib/jwt-utils"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Constantes para almacenamiento
const TOKENS_STORAGE = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Restaura los tokens desde el localStorage al cargar
   */
  useEffect(() => {
    const restoreTokens = () => {
      try {
        const storedAccessToken = localStorage.getItem(TOKENS_STORAGE.ACCESS_TOKEN)
        const storedRefreshToken = localStorage.getItem(TOKENS_STORAGE.REFRESH_TOKEN)
        const storedUser = localStorage.getItem(TOKENS_STORAGE.USER)

        // Verificar si el access token aún es válido
        if (storedAccessToken && isTokenValid(storedAccessToken)) {
          setAccessToken(storedAccessToken)
          setRefreshToken(storedRefreshToken)
          
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser))
            } catch (e) {
              console.error("Failed to parse stored user:", e)
            }
          }
        } else if (storedRefreshToken && isTokenValid(storedRefreshToken)) {
          // Si el access token expiró pero el refresh token es válido, renovar
          console.log("Access token expired, attempting to refresh...")
          refreshAccessToken(storedRefreshToken)
            .catch((err) => {
              console.error("Failed to refresh token on app load:", err)
              localStorage.removeItem(TOKENS_STORAGE.ACCESS_TOKEN)
              localStorage.removeItem(TOKENS_STORAGE.REFRESH_TOKEN)
              localStorage.removeItem(TOKENS_STORAGE.USER)
            })
        } else {
          // Ambos tokens expirados, limpiar
          localStorage.removeItem(TOKENS_STORAGE.ACCESS_TOKEN)
          localStorage.removeItem(TOKENS_STORAGE.REFRESH_TOKEN)
          localStorage.removeItem(TOKENS_STORAGE.USER)
        }
      } catch (err) {
        console.error("Error restoring tokens:", err)
      } finally {
        setIsLoading(false)
      }
    }

    restoreTokens()
  }, [])

  /**
   * Configura el intervalo para renovar tokens automáticamente
   */
  useEffect(() => {
    if (!accessToken || !refreshToken) return

    const setupRefreshInterval = () => {
      // Limpiar intervalo anterior si existe
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      // Calcular cuándo renovar (cuando falten 5 minutos para expirar)
      const secondsRemaining = getTokenExpiresIn(accessToken)
      const refreshInSeconds = Math.max(secondsRemaining - 5 * 60, 30) // Al menos esperar 30 segundos
      const refreshInMs = refreshInSeconds * 1000

      console.log(`[Auth] Token expires in ${secondsRemaining}s, will refresh in ${refreshInSeconds}s`)

      // Configurar intervalo
      refreshIntervalRef.current = setInterval(async () => {
        console.log("[Auth] Attempting automatic token refresh...")
        try {
          await refreshAccessToken(refreshToken)
        } catch (err) {
          console.error("[Auth] Auto-refresh failed:", err)
          // No hacer logout automático, dejar que el usuario continúe
          // El servidor rechazará la solicitud si el token está realmente expirado
        }
      }, refreshInMs)
    }

    setupRefreshInterval()

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [accessToken, refreshToken])

  /**
   * Guarda los tokens en localStorage
   */
  const saveTokens = (access: string, refresh: string, userData: User) => {
    localStorage.setItem(TOKENS_STORAGE.ACCESS_TOKEN, access)
    localStorage.setItem(TOKENS_STORAGE.REFRESH_TOKEN, refresh)
    localStorage.setItem(TOKENS_STORAGE.USER, JSON.stringify(userData))
    
    setAccessToken(access)
    setRefreshToken(refresh)
    setUser(userData)
    setError(null)
  }

  /**
   * Limpia los tokens del almacenamiento
   */
  const clearTokens = () => {
    localStorage.removeItem(TOKENS_STORAGE.ACCESS_TOKEN)
    localStorage.removeItem(TOKENS_STORAGE.REFRESH_TOKEN)
    localStorage.removeItem(TOKENS_STORAGE.USER)
    
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  /**
   * Renueva el access token usando el refresh token
   */
  const refreshAccessToken = async (refreshTokenValue: string) => {
    try {
      const response = await authService.refresh(refreshTokenValue)
      
      setAccessToken(response.access_token)
      localStorage.setItem(TOKENS_STORAGE.ACCESS_TOKEN, response.access_token)
      
      console.log("[Auth] Token refreshed successfully")
      return response.access_token
    } catch (err) {
      console.error("[Auth] Failed to refresh token:", err)
      clearTokens()
      throw err
    }
  }

  /**
   * Login con correo y contraseña
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authService.login({
        correo: email,
        password,
      })

      // Construir objeto de usuario con toda la información
      const userData: User = {
        id_usuario: response.user.id_usuario,
        correo: response.user.correo,
        nombre: response.user.nombre,
        rol: response.user.rol,
      }

      // Guardar tokens y usuario
      saveTokens(response.access_token, response.refresh_token, userData)

      console.log("[Auth] Login successful")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Registro de nuevo usuario
   */
  const register = async (email: string, password: string, nombre: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Registrar usuario
      await authService.register({
        correo: email,
        nombre,
        password,
        rol: "cliente", // Por defecto, los nuevos usuarios son clientes
      })

      console.log("[Auth] Registration successful, logging in...")

      // Hacer login automático después del registro
      await login(email, password)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al registrar"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout y revocación de tokens
   */
  const logout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Intentar revocar tokens en el servidor
      if (refreshToken) {
        try {
          await authService.logout(refreshToken)
          console.log("[Auth] Tokens revoked on server")
        } catch (err) {
          console.warn("[Auth] Failed to revoke tokens on server:", err)
          // Continuar con logout local incluso si falla la revocación remota
        }
      }

      // Limpiar tokens locales
      clearTokens()

      console.log("[Auth] Logout successful")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cerrar sesión"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!user,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
