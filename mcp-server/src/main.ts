import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcErrorCode } from './types';
import { ToolRegistry } from './tools/registry';
import { Logger } from './utils/logger';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const logger = new Logger('MCPServer');
const toolRegistry = new ToolRegistry();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Endpoint principal JSON-RPC 2.0
 */
app.post('/mcp', async (req: Request, res: Response) => {
  const request: JsonRpcRequest = req.body;

  // Validar estructura JSON-RPC
  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return res.json(createErrorResponse(
      request.id || null,
      JsonRpcErrorCode.INVALID_REQUEST,
      'Invalid JSON-RPC version'
    ));
  }

  if (!request.method) {
    return res.json(createErrorResponse(
      request.id,
      JsonRpcErrorCode.INVALID_REQUEST,
      'Method is required'
    ));
  }

  try {
    logger.info(`Procesando método: ${request.method}`, request.params);

    // Manejar métodos especiales del protocolo MCP
    switch (request.method) {
      case 'tools/list':
        return res.json(createSuccessResponse(
          request.id,
          { tools: toolRegistry.getAllTools() }
        ));

      case 'tools/call':
        return await handleToolCall(request, res);

      default:
        return res.json(createErrorResponse(
          request.id,
          JsonRpcErrorCode.METHOD_NOT_FOUND,
          `Method "${request.method}" not found`
        ));
    }
  } catch (error) {
    logger.error('Error procesando request', error);
    return res.json(createErrorResponse(
      request.id,
      JsonRpcErrorCode.INTERNAL_ERROR,
      `Internal error: ${error}`
    ));
  }
});

/**
 * Manejar la ejecución de una tool
 */
async function handleToolCall(request: JsonRpcRequest, res: Response): Promise<Response> {
  const { name, arguments: args } = request.params || {};

  if (!name) {
    return res.json(createErrorResponse(
      request.id,
      JsonRpcErrorCode.INVALID_PARAMS,
      'Tool name is required'
    ));
  }

  if (!toolRegistry.hasTool(name)) {
    return res.json(createErrorResponse(
      request.id,
      JsonRpcErrorCode.METHOD_NOT_FOUND,
      `Tool "${name}" not found`
    ));
  }

  try {
    const result = await toolRegistry.executeTool(name, args || {});
    
    if (result.isError) {
      return res.json(createErrorResponse(
        request.id,
        JsonRpcErrorCode.INTERNAL_ERROR,
        result.content[0].text
      ));
    }

    return res.json(createSuccessResponse(request.id, result));
  } catch (error) {
    logger.error(`Error ejecutando tool ${name}`, error);
    return res.json(createErrorResponse(
      request.id,
      JsonRpcErrorCode.INTERNAL_ERROR,
      `Error executing tool: ${error}`
    ));
  }
}

/**
 * Endpoint de health check
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tools: toolRegistry.getAllTools().length,
  });
});

/**
 * Endpoint para listar tools (alternativo, REST)
 */
app.get('/tools', (_req, res) => {
  res.json({
    tools: toolRegistry.getAllTools(),
  });
});

/**
 * Crear respuesta de éxito JSON-RPC
 */
function createSuccessResponse(id: string | number, result: any): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

/**
 * Crear respuesta de error JSON-RPC
 */
function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: any
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message,
      data,
    },
    id,
  };
}

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 MCP Server corriendo en http://localhost:${PORT}`);
  logger.info(`📋 Tools disponibles: ${toolRegistry.getAllTools().length}`);
  logger.info(`🔧 Endpoint JSON-RPC: POST http://localhost:${PORT}/mcp`);
  logger.info(`❤️  Health check: GET http://localhost:${PORT}/health`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});