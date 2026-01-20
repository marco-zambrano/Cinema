import { Tool, ToolResult } from '../types';
import { 
  BuscarPeliculaTool, 
  ejectuarBuscarPeliculaTool 
} from '../tools/buscar-pelicula.tool';
import { 
  ValidarDisponibilidadSalaTool, 
  exValidarDisponbilidadSalaTool 
} from '../tools/validar-disponibilidad.tool';
import { 
  crearReservaTool, 
  ejecutarCrearReserva 
} from '../tools/crear-reserva.tool';

/**
 * Registro centralizado de todas las Tools disponibles
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executors: Map<string, (params: any) => Promise<ToolResult>> = new Map();

  constructor() {
    this.registerTool(BuscarPeliculaTool, ejectuarBuscarPeliculaTool);
    this.registerTool(ValidarDisponibilidadSalaTool, exValidarDisponbilidadSalaTool);
    this.registerTool(crearReservaTool, ejecutarCrearReserva);
  }

  /**
   * Registrar una nueva tool con su executor
   */
  private registerTool(
    tool: Tool, 
    executor: (params: any) => Promise<ToolResult>
  ): void {
    this.tools.set(tool.name, tool);
    this.executors.set(tool.name, executor);
  }

  /**
   * Obtener todas las tools disponibles
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Obtener una tool por nombre
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Ejecutar una tool por nombre
   */
  async executeTool(name: string, params: any): Promise<ToolResult> {
    const executor = this.executors.get(name);
    
    if (!executor) {
      return {
        content: [{
          type: 'text',
          text: `Tool "${name}" no encontrada`,
        }],
        isError: true,
      };
    }

    return await executor(params);
  }

  /**
   * Verificar si una tool existe
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}