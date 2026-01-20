/**
 * Utilidades para decodificar y validar tokens JWT localmente
 * No hace llamadas HTTP - todo se valida en el cliente
 */

interface JWTPayload {
  id_usuario: string;
  correo: string;
  rol: string;
  type: "access" | "refresh";
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * Decodifica un token JWT sin validar la firma
 * NOTA: Esto es seguro porque la firma se valida en el servidor en login
 * El token se usará solo con el Authorization header en cada request
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    // JWT tiene formato: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format");
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    
    // Agregar padding si es necesario
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    
    // Decodificar de base64
    const decoded = atob(padded);
    
    // Parsear JSON
    const parsed = JSON.parse(decoded) as JWTPayload;
    
    return parsed;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Verifica si un token ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  // exp está en segundos, Date.now() está en milisegundos
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime > expirationTime;
}

/**
 * Obtiene el tiempo restante para que expire el token (en segundos)
 */
export function getTokenExpiresIn(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const secondsRemaining = Math.floor((expirationTime - currentTime) / 1000);

  return Math.max(0, secondsRemaining);
}

/**
 * Verifica si un token debería renovarse
 * (cuando falten 5 minutos para expirar)
 */
export function shouldRefreshToken(token: string): boolean {
  const secondsRemaining = getTokenExpiresIn(token);
  const fiveMinutesInSeconds = 5 * 60;

  return secondsRemaining < fiveMinutesInSeconds && secondsRemaining > 0;
}

/**
 * Obtiene los datos del usuario desde el token
 */
export function getUserFromToken(token: string): {
  id_usuario: string;
  correo: string;
  rol: string;
} | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id_usuario: payload.id_usuario,
    correo: payload.correo,
    rol: payload.rol,
  };
}

/**
 * Valida que un token sea válido
 */
export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  
  if (!payload) return false;
  if (!payload.id_usuario || !payload.correo) return false;
  if (isTokenExpired(token)) return false;

  return true;
}

/**
 * Obtiene el tipo de token (access o refresh)
 */
export function getTokenType(token: string): "access" | "refresh" | null {
  const payload = decodeToken(token);
  return payload?.type || null;
}

/**
 * Valida que el token sea un access token (no refresh)
 */
export function isAccessToken(token: string): boolean {
  return getTokenType(token) === "access";
}

/**
 * Valida que el token sea un refresh token
 */
export function isRefreshToken(token: string): boolean {
  return getTokenType(token) === "refresh";
}
