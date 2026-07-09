import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/shared/errors/app.error.js';
import { sendError } from '@/shared/utils/response.utils.js';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.message);
    return;
  }

  console.error('Unhandled error:', error);

  sendError(res, 500, 'Error interno del servidor');
}
