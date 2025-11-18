import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Sala } from 'src/salas/entities/sala.entity';
import { Pelicula } from 'src/peliculas/entities/pelicula.entity';
import { Asiento } from 'src/asientos/entities/asiento.entity';
import { Reserva } from 'src/reservas/entities/reserva.entity';
import { Factura } from 'src/facturas/entities/factura.entity';
import { Funciones } from 'src/funciones/entities/funcione.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

const API_BASE_URL = 'http://localhost:8000/api/v1';

@Injectable()
export class HttpServices {
  private readonly logger = new Logger(HttpServices.name);
  constructor(private readonly httpService: HttpService) {}

  private async handleRequest<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.logger.debug(`Realizando petición GET a: ${url}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method: 'GET',
          url: endpoint,
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error('Error en la petición HTTP:');
            this.logger.error('URL:', url);
            this.logger.error('Código de estado:', error.response?.status);
            this.logger.error('Mensaje de error:', error.message);
            this.logger.error('Datos de respuesta:', error.response?.data);
            this.logger.error('Headers de respuesta:', error.response?.headers);
            
            const errorMessage = `Error al realizar la petición a ${endpoint}: ${error.message}`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
          }),
        ),
      );
      
      this.logger.debug(`Respuesta recibida de ${url}:`, response.status, response.statusText);
      return response.data;
      
    } catch (error) {
      this.logger.error('Error inesperado al procesar la petición:', error);
      throw error;
    }
  }

  async findAllUsers(): Promise<Usuario[]> {
    return this.handleRequest<Usuario[]>('/usuarios');
  }
  async findOneUser(id: string): Promise<Usuario> {
    return this.handleRequest<Usuario>(`/usuarios/${id}`);
  }
  // Peliculas
  async findAllPeliculas(): Promise<Pelicula[]> {
    const peliculas = await this.handleRequest<any[]>('/peliculas');
    return peliculas.map(pelicula => ({
      id_pelicula: pelicula.id_pelicula,
      titulo: pelicula.titulo,
      genero: pelicula.genero,
      descripcion: pelicula.descripcion,
      clasificacion: pelicula.clasificacion,
      duracion: pelicula.duracion
    }));
  }
  async findOnePelicula(id: string): Promise<Pelicula> {
    const pelicula = await this.handleRequest<any>(`/peliculas/${id}`);
    return {
      id_pelicula: pelicula.id_pelicula,
      titulo: pelicula.titulo,
      genero: pelicula.genero,
      descripcion: pelicula.descripcion,
      clasificacion: pelicula.clasificacion,
      duracion: pelicula.duracion 
    };
  }

  // Salas
  async findAllSalas(): Promise<Sala[]> {
    return this.handleRequest<Sala[]>('/salas');
  }
  async findOneSala(id: string): Promise<Sala> {
    return this.handleRequest<Sala>(`/salas/${id}`);
  }
  // Asientos
  async findAllAsientos(): Promise<Asiento[]> {
    return this.handleRequest<Asiento[]>('/asientos');
  }
  async findOneAsiento(id: string): Promise<Asiento> {
    return this.handleRequest<Asiento>(`/asientos/${id}`);
  }
  // Reservas
  async findAllReservas(): Promise<Reserva[]> {
    return this.handleRequest<Reserva[]>('/reservas');
  }
  async findOneReserva(id: string): Promise<Reserva> {
    return this.handleRequest<Reserva>(`/reservas/${id}`);
  }

  async findAllFacturas(): Promise<Factura[]> {
    return this.handleRequest<Factura[]>('/facturas');
  }
  async findOneFactura(id: string): Promise<Factura> {
    return this.handleRequest<Factura>(`/facturas/${id}`);
  }
  // Funciones
  async findAllFunciones(): Promise<Funciones[]> {
    return this.handleRequest<Funciones[]>('/funciones');
  }
  async findOneFuncion(id: string): Promise<Funciones> {
    return this.handleRequest<Funciones>(`/funciones/${id}`);
  }
}
