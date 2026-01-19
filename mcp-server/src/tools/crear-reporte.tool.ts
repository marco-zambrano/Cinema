import {Tool, ToolResult} from '../types';
import {BackendClient} from '../services/backend-client.js';
import {Logger} from '../utils/logger.js';

const logger = new Logger('CrearReporteTool');
const backendClient = new BackendClient();

/** 
 * TOOL 4: WRITE - Crear reporte de ventas
 * Tipo: Write/Transactional
 */

export const CrearReporteTool: Tool = {
    name: 'crear_reporte',
    description: 'Crea un reporte de ventas para un rango de fechas específico. Devuelve un resumen de las ventas realizadas en ese período.',
    inputSchema: {
        type: 'object',
        properties: {
            fechaInicio: {
                type: 'string',
                description: 'Fecha de inicio del período del reporte en formato YYYY-MM-DD.',
            },
            fechaFin: {
                type: 'string',
                description: 'Fecha de fin del período del reporte en formato YYYY-MM-DD.',
            },
            tipo_reporte: {
                type: 'string',
                description: 'Tipode de reporte generado (problemas con reservar peliculas, problemas con el pago, otros)',
            },
            descripcion_reporte:{
                type: 'string',
                description: 'Descripción detallada del reporte generado',
            },  
            userId:{
                type: 'string',
                description: 'ID del usuario que genera el reporte',
            },
            required: ['fechaInicio', 'fechaFin', 'tipo_reporte', 'descripcion_reporte', 'userId'],
        }
    }
}

export async function exCrearReporteTool(params: {
    fechaInicio: string;
    fechaFin: string;
    tipo_reporte: string;
    descripcion_reporte: string;
    userId: string;
}): Promise<ToolResult> {
    try{
        logger.info(`Ejecutando crear_reporte con parámetros:`, params);

        //validar parametros requeridos

        if(!params.fechaInicio || !params.fechaFin || !params.tipo_reporte || !params.descripcion_reporte || !params.userId){
            return{
                content: [{
                    type: 'text',
                    text: 'Error: Todos los parámetros son obligatorios.',
                }],
                isError: true,
            };
        }

    //crear el reporte en el backend

    const reporteData = {
        fechaInicio: params.fechaInicio,
        fechaFin: params.fechaFin,
        tipo_reporte: params.tipo_reporte,
        descripcion_reporte: params.descripcion_reporte,
        userId: params.userId,
    };

    const reporte = await backendClient.CrearReporte(reporteData);
    return {
        content: [{
            type: 'text',
            text: `Reporte creado exitosamente con ID: ${reporte.id}`+
            `\nTipo de reporte: ${reporte.tipo_reporte}` +
            `\nDescripción: ${reporte.descripcion_reporte}` +
            `\nFecha de creación: ${reporte.fecha_creacion}` +
            `\nUsuario ID: ${reporte.userId}`,
        }]
    }

    } catch (error){
        logger.error('Error ejecutando crear_reporte', error);
        return {
          content: [{
            type: 'text',
            text: `Error al crear reporte: ${error}`,
          }],
          isError: true,
        };
    }
}    