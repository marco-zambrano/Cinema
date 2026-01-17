/**
 * Interceptor de tokens para manejar automáticamente:
 * 1. Agregar access token a cada request
 * 2. Detectar si el access token expiró
 * 3. Intentar renovar el access token si es necesario
 * 4. Reintentar el request con el nuevo token
 * 5. Si todo falla, redirigir a login
 */

import { isTokenExpired, shouldRefreshToken } from './jwt-utils'
import { authService } from './auth-service'

interface InterceptorConfig {
  onTokenRefreshed?: (newToken: string) => void
  onRefreshFailed?: () => void
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

/**
 * Notifica a todos los subscribers cuando el token se renueva
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

/**
 * Se suscribe a las notificaciones de renovación de token
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

/**
 * Obtiene el access token del localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Obtiene el refresh token del localStorage
 */
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

/**
 * Intercepta una petición fetch y maneja tokens automáticamente
 */
export async function fetchWithTokenInterceptor(
  url: string,
  options: RequestInit = {},
  config: InterceptorConfig = {}
): Promise<Response> {
  // Obtener token actual
  let token = getAccessToken()

  // Si el token no existe, hacer la petición sin él
  if (!token) {
    return fetch(url, options)
  }

  // Verificar si el token está expirado o necesita renovación
  if (isTokenExpired(token)) {
    console.log('[Interceptor] Token expired, attempting to refresh...')

    // Si otro request ya está renovando el token, esperar su resultado
    if (isRefreshing) {
      return new Promise<Response>((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          }
          resolve(fetch(url, newOptions))
        })
      }).catch((error) => {
        console.error('[Interceptor] Failed after refresh wait:', error)
        config.onRefreshFailed?.()
        throw error
      })
    }

    // Marcar que estamos renovando
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Intentar renovar el token
      const response = await authService.refresh(refreshToken)
      token = response.access_token

      // Guardar nuevo token
      localStorage.setItem('access_token', response.access_token)

      // Notificar a otros subscribers
      onRefreshed(response.access_token)

      config.onTokenRefreshed?.(response.access_token)

      console.log('[Interceptor] Token refreshed successfully')
    } catch (error) {
      console.error('[Interceptor] Token refresh failed:', error)

      // Limpiar tokens y redirigir a login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      config.onRefreshFailed?.()

      // Redirigir a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw error
    } finally {
      isRefreshing = false
    }
  } else if (shouldRefreshToken(token)) {
    // Token se puede renovar proactivamente (cuando falten 5 minutos)
    console.log('[Interceptor] Token expiring soon, refreshing proactively...')

    try {
      const refreshToken = getRefreshToken()
      if (refreshToken && !isRefreshing) {
        isRefreshing = true

        const response = await authService.refresh(refreshToken)
        localStorage.setItem('access_token', response.access_token)
        token = response.access_token

        onRefreshed(response.access_token)
        config.onTokenRefreshed?.(response.access_token)

        console.log('[Interceptor] Token refreshed proactively')

        isRefreshing = false
      }
    } catch (error) {
      console.warn('[Interceptor] Proactive refresh failed (non-critical):', error)
      isRefreshing = false
    }
  }

  // Agregar token al header
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  }

  // Hacer la petición con el token
  return fetch(url, requestOptions)
}

/**
 * Hook para usar el interceptor en componentes
 */
export function useTokenInterceptor() {
  return {
    fetchWithInterceptor: fetchWithTokenInterceptor,
  }
}
