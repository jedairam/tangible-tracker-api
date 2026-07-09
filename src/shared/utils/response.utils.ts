import type { Response } from 'express';
import type { ApiMeta, ApiSuccessResponse } from '../types/api-response.types.js';

//Contrato estándar para las respuestas de la API

//Enviar una respuesta exitosa
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  options?: { meta?: ApiMeta; message?: string },
): void {
  const body: ApiSuccessResponse<T> = { success: true, data };

  if (options?.meta !== undefined) {
    body.meta = options.meta;
  }

  if (options?.message !== undefined) {
    body.message = options.message;
  }

  res.status(statusCode).json(body);
}

//Enviar una lista de recursos
export function sendList<T>(res: Response, data: T[]): void {
  sendSuccess(res, data, 200, { meta: { total: data.length } });
}

//Enviar un error
export function sendError(res: Response, statusCode: number, message: string): void {
  res.status(statusCode).json({
    success: false,
    error: { statusCode, message },
  });
}
