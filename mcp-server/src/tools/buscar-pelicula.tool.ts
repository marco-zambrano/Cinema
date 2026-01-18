import {Tool, ToolResult} from '../types/index.js';
import {BackendClient} from '../services/backend-client.js';
import {Logger} from '../utils/logger.js';

const logger = new Logger('BuscarPeliculaTool');
const backendClient = new BackendClient();

/**
 * Tool 1: Búsqueda de películas por título
 * tipo: read
 */

export const BuscarPeliculaTool: Tool = {
    name: 'buscar_pelicula',
    description: 'Busca películas por título. Devuelve una lista de películas que coincidan con el criterio de búsqueda.',
    inputSchema: {
        type: 'object',
        properties: {
            titulo: {
                type: 'string',
                description: 'Título o parte del título de la película a buscar. Si se omite, devuelve todas las películas.',
            },
        },
        required: [],
    },
};

export async function ejectuarBuscarPeliculaTool(params: {titulo?: string}): Promise<ToolResult> {
     try {
    logger.info(`Ejecutando buscar_pelicula con parámetros:`, params);
    
    const peliculas = await backendClient.buscarPeliculas(params.titulo);
    
    if (!peliculas || peliculas.length === 0) {
      return {
        content: [{
          type: 'text',
          text: params.titulo 
            ? `No se encontraron películas con el título "${params.titulo}"`
            : 'No hay películas disponibles',
        }],
      };
    }

    const resultado = peliculas.map((p: any) => 
      `- ${p.titulo} (${p.genero}) - ${p.duracion} min - ID: ${p.id}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Películas encontradas:\n${resultado}`,
      }],
    };
  } catch (error) {
    logger.error('Error ejecutando buscar_pelicula', error);
    return {
      content: [{
        type: 'text',
        text: `Error al buscar películas: ${error}`,
      }],
      isError: true,
    };
  }
};