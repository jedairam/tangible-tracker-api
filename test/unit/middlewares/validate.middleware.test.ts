import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateMiddleware } from '@/middlewares/validate.middleware.js';
import { ValidationError } from '@/shared/errors/validation.error.js';
import { createMockNext, createMockRequest, createMockResponse } from '../../helpers/mock-express.js';

const bodySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
});

const paramsSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio'),
});

describe('validateMiddleware', () => {
  it('pasa body válido y reemplaza req.body', () => {
    const req = createMockRequest({ body: { title: 'Tarea' } });
    const res = createMockResponse();
    const next = createMockNext();

    validateMiddleware(bodySchema)(req, res, next);

    expect(req.body).toEqual({ title: 'Tarea' });
    expect(next).toHaveBeenCalledWith();
  });

  it('propaga ValidationError con body inválido', () => {
    const req = createMockRequest({ body: { title: '' } });
    const res = createMockResponse();
    const next = createMockNext();

    validateMiddleware(bodySchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = vi.mocked(next).mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).message).toBe('El título es obligatorio');
  });

  it('valida params cuando source es params', () => {
    const req = createMockRequest({ params: { id: 'task-1' } });
    const res = createMockResponse();
    const next = createMockNext();

    validateMiddleware(paramsSchema, 'params')(req, res, next);

    expect(req.params).toEqual({ id: 'task-1' });
    expect(next).toHaveBeenCalledWith();
  });
});
