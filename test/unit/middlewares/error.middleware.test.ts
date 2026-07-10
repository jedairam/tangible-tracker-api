import { describe, expect, it, vi } from 'vitest';
import { errorMiddleware } from '@/middlewares/error.middleware.js';
import { AppError } from '@/shared/errors/app.error.js';
import { NotFoundError } from '@/shared/errors/not-found.error.js';
import { createMockNext, createMockRequest, createMockResponse } from '../../helpers/mock-express.js';

describe('errorMiddleware', () => {
  it('responde con el status de AppError', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorMiddleware(new NotFoundError('Tarea no encontrada'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { statusCode: 404, message: 'Tarea no encontrada' },
    });
  });

  it('oculta detalles de errores no controlados', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorMiddleware(new Error('fallo interno'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { statusCode: 500, message: 'Error interno del servidor' },
    });

    consoleSpy.mockRestore();
  });

  it('maneja AppError genérico', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorMiddleware(new AppError(403, 'Prohibido'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { statusCode: 403, message: 'Prohibido' },
    });
  });
});
