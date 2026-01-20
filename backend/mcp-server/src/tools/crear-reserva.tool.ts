import { Tool, ToolResult } from '../types';
import { BackendClient } from '../services/backend-client';
import { Logger } from '../utils/logger';

const logger = new Logger('CrearReservaTool');
const backendClient = new BackendClient();

/**
 * TOOL 3: ACCIÓN - Crear nueva reserva
 * Tipo: Write/Transactional
 */
export const crearReservaTool: Tool = {
  name: 'crear_reserva',
  description: 'Crea una nueva reserva para una función específica. Requiere el ID de la función y los datos del usuario.',
  inputSchema: {
    type: 'object',
    properties: {
      funcionId: {
        type: 'string',
        description: 'ID de la función de película para la cual se hace la reserva',
      },
      usuarioId: {
        type: 'string',
        description: 'ID del usuario que hace la reserva',
      },
      usuarioNombre: {
        type: 'string',
        description: 'Nombre del usuario',
      },
      email: {
        type: 'string',
        description: 'Email del usuario',
      },
      cantidadAsientos: {
        type: 'integer',
        description: 'Cantidad de asientos a reservar',
        default: 1,
      },
      total: {
        type: 'number',
        description: 'Total a pagar por la reserva',
        default: 0,
      },
    },
    required: ['funcionId', 'usuarioId', 'usuarioNombre', 'email'],
  },
};

export async function ejecutarCrearReserva(params: {
  funcionId: string;
  usuarioId: string;
  usuarioNombre: string;
  email: string;
  cantidadAsientos?: number;
  total?: number;
}): Promise<ToolResult> {
  try {
    logger.info(`Ejecutando crear_reserva con parámetros:`, params);
    
    // Validar parámetros requeridos
    if (!params.funcionId || !params.usuarioId || !params.usuarioNombre || !params.email) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Todos los parámetros son requeridos (funcionId, usuarioId, usuarioNombre, email)',
        }],
        isError: true,
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.email)) {
      return {
        content: [{
          type: 'text',
          text: 'Error: El formato del email no es válido',
        }],
        isError: true,
      };
    }

    // Crear la reserva
    const reservaData = {
      funcionId: params.funcionId,
      usuarioId: params.usuarioId,
      cantidadAsientos: params.cantidadAsientos ?? 1,
      total: params.total ?? 0,
      User: [{
        usuarioId: params.usuarioId,
        usuario_nombre: params.usuarioNombre,
        email: params.email,
      }],
    };

    const reserva = await backendClient.crearReserva(reservaData);
    
    return {
      content: [{
        type: 'text',
        text: `✓ Reserva creada exitosamente!\n` +
              `ID Reserva: ${reserva.id}\n` +
              `Función: ${reserva.funcionId}\n` +
              `Usuario: ${params.usuarioNombre} (${params.email})\n` +
              `Fecha: ${new Date(reserva.createdAt).toLocaleString('es-ES')}`,
      }],
    };
  } catch (error) {
    logger.error('Error ejecutando crear_reserva', error);
    return {
      content: [{
        type: 'text',
        text: `Error al crear reserva: ${error}`,
      }],
      isError: true,
    };
  }
}