import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from '../utils/logger';

/**
 * Cliente HTTP para comunicarse con el Backend (apunta al REST API local)
 * El backend REST expone sus rutas bajo el prefijo `/api/v1`.
 */
export class BackendClient {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(baseURL: string = process.env.BACKEND_URL || 'http://localhost:8000/api/v1') {
    this.logger = new Logger('BackendClient');
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        this.logger.error('Request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response: ${response.status}`, response.data);
        return response;
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): void {
    if (error.response) {
      this.logger.error(`Backend error: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      this.logger.error('No response from backend', error.request);
    } else {
      this.logger.error('Error setting up request', error.message);
    }
  }

  /**
   * PELÍCULAS - Buscar por título
   */
  async buscarPeliculas(titulo?: string): Promise<any> {
    try {
      const response = await this.client.get('/peliculas', {
        params: titulo ? { titulo } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error buscando películas: ${error}`);
    }
  }

  /**
   * PELÍCULAS - Obtener por ID
   */
  async obtenerPelicula(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/peliculas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo película: ${error}`);
    }
  }

  /**
   * RESERVAS - Crear nueva reserva
   */
  async crearReserva(data: {
    funcionId: string;
    usuarioId: string;
    cantidadAsientos: number;
    total: number;
    User: Array<{ usuarioId: string; usuario_nombre: string; email: string }>;
  }): Promise<any> {
    try {
      const response = await this.client.post('/reservas', data);
      return response.data;
    } catch (error) {
      throw new Error(`Error creando reserva: ${error}`);
    }
  }

  /**
   * RESERVAS - Listar todas
   */
  async listarReservas(): Promise<any> {
    try {
      const response = await this.client.get('/reservas');
      return response.data;
    } catch (error) {
      throw new Error(`Error listando reservas: ${error}`);
    }
  }

  /**
   * RESERVAS - Obtener por ID
   */
  async obtenerReserva(id: string): Promise<any> {
    try {
      const response = await this.client.get(`/reservas/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo reserva: ${error}`);
    }
  }

  /**
   * VALIDACIÓN - Verificar disponibilidad de película
   */
  async validarDisponibilidad(peliculaId: string): Promise<boolean> {
    try {
      const pelicula = await this.obtenerPelicula(peliculaId);
      return pelicula && pelicula.id !== undefined;
    } catch (error) {
      return false;
    }
  }

  async validarDisponibilidadSala(functionId: string): Promise<number> {
    try {
      const response = await this.client.get(`/funciones/${functionId}/disponibilidad`);
      return response.data.asientosDisponibles;
    } catch (error) {
      throw new Error(`Error validando disponibilidad de sala: ${error}`);
    }
  }

  async obtenerFuncionPorId(functionId: string): Promise<any> {
    try {
      const response = await this.client.get(`/funciones/${functionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo función: ${error}`);
    }
  } 
}