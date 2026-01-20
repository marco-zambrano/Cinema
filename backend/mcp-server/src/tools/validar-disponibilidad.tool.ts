import { Tool, ToolResult } from '../types';
import { BackendClient } from '../services/backend-client';
import { Logger } from '../utils/logger';


const logger = new Logger('ValidarDisponibilidadTool');
const backendClient = new BackendClient();

/** 
 * TOOL 2: READ - validar disponbilidad de asientos para una función
 */

export const ValidarDisponibilidadSalaTool: Tool = {
    name: 'validar_disponibilidad_sala',
    description: 'Valida la disponibilidad de asientos para una función específica. Devuelve el número de asientos disponibles.',
    inputSchema: {
        type: 'object',
        properties: {
            functionId: {
                type: 'string',
                description: 'ID de la función para la cual se desea validar la disponibilidad de asientos.',
            },
        },
        required: ['functionId'],
    },
};

export async function exValidarDisponbilidadSalaTool(params: {functionId: string}): Promise<ToolResult> {
    try{
        logger.info(`Ejecutando validar_disponibilidad_sala con parámetros:`, params);

        if(!params.functionId){
            return{
                content: [{
                    type: 'text',
                    text: 'Error: El parámetro functionId es obligatorio.',
                }],
                isError: true,
            };
        }

        const asientosDisponibles = await backendClient.validarDisponibilidadSala(params.functionId);

        if(asientosDisponibles > 0){
            const funcion = await backendClient.obtenerFuncionPorId(params.functionId);
            const salaId = funcion?.id_sala || funcion?.sala?.id_sala || 'desconocida';

            return {
                content: [{
                    type: 'text',
                    text: `La sala ${salaId} tiene ${asientosDisponibles} asientos disponibles para la función ${params.functionId}.`,
                }],
            };
        } else {
            return {
                content: [{
                    type: 'text',
                    text: `No hay asientos disponibles para la función ${params.functionId}.`,
                }],
                isError: true,
            };
        }
    }catch (error) {
        logger.error('Error ejecutando validar_disponibilidad_sala', error);
        return {
          content: [{
            type: 'text',
            text: `Error al validar disponibilidad de sala: ${error}`,
          }],
            isError: true,
        };
      }
}