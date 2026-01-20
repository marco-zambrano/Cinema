/**
 * Cliente para comunicarse con el Auth Service microservicio
 * URL: http://localhost:8001/api/v1
 * 
 * Endpoints:
 * - POST /auth/register - Registrar nuevo usuario
 * - POST /auth/login - Iniciar sesión
 * - POST /auth/logout - Cerrar sesión
 * - POST /auth/refresh - Renovar access token
 * - POST /auth/validate - Validar token (uso interno)
 * - GET /auth/me - Obtener datos del usuario autenticado
 */

import { AUTH_SERVICE_URL } from "./config";
import type { UserRole } from "./types";

interface LoginRequest {
  correo: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id_usuario: string;
    correo: string;
    nombre: string;
    rol: UserRole;
    activo: boolean;
    fecha_creacion: string;
    ultimo_login: string | null;
  };
}

interface RegisterRequest {
  correo: string;
  nombre: string;
  password: string;
  rol?: UserRole;
}

interface RegisterResponse {
  id_usuario: string;
  correo: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: string;
  ultimo_login: string | null;
}

interface RefreshRequest {
  refresh_token: string;
}

interface RefreshResponse {
  access_token: string;
  token_type: string;
}

interface LogoutRequest {
  refresh_token?: string;
}

interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  id_usuario: string;
  correo: string;
  rol: UserRole;
  type: "access" | "refresh";
  exp: number;
  iat: number;
}

interface UserProfileResponse {
  id_usuario: string;
  correo: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: string;
  ultimo_login: string | null;
}

class AuthServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = AUTH_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza una petición HTTP al Auth Service
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any,
    token?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    try {
      console.log(`[AuthService] ${method} ${url}`);
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = "Error en la solicitud";
        try {
          const errorData = await response.json();
          console.error(`[AuthService] Error Response:`, errorData);
          errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          console.error(`[AuthService] Failed to parse error response:`, e);
        }
        throw new Error(errorMessage);
      }

      // Si la respuesta es 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      console.log(`[AuthService] Success Response:`, data);
      return data as T;
    } catch (error) {
      console.error(`[AuthService] Request Error:`, {
        url,
        method,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Registrar un nuevo usuario
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(
      "/auth/register",
      "POST",
      userData
    );
  }

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      "/auth/login",
      "POST",
      credentials
    );
  }

  /**
   * Cerrar sesión y revocar tokens
   */
  async logout(refreshToken?: string, accessToken?: string): Promise<void> {
    const body: LogoutRequest = {};
    if (refreshToken) {
      body.refresh_token = refreshToken;
    }
    
    return this.request<void>(
      "/auth/logout",
      "POST",
      body,
      accessToken
    );
  }

  /**
   * Renovar access token usando refresh token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return this.request<RefreshResponse>(
      "/auth/refresh",
      "POST",
      { refresh_token: refreshToken }
    );
  }

  /**
   * Validar un token (uso interno del backend)
   * En el frontend se puede usar jwt-utils.ts en su lugar
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    return this.request<ValidateTokenResponse>(
      "/auth/validate",
      "POST",
      { token }
    );
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(token: string): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>(
      "/auth/me",
      "GET",
      undefined,
      token
    );
  }
}

// Exportar instancia singleton
export const authService = new AuthServiceClient();
