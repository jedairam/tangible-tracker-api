import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/errors/app.error.js';
import { NotFoundError } from '@/shared/errors/not-found.error.js';
import { ValidationError } from '@/shared/errors/validation.error.js';

describe('AppError', () => {
  it('guarda statusCode y mensaje', () => {
    const error = new AppError(418, 'Soy una tetera');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('Soy una tetera');
  });
});

describe('ValidationError', () => {
  it('usa status 400', () => {
    const error = new ValidationError('Campo inválido');

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Campo inválido');
  });
});

describe('NotFoundError', () => {
  it('usa status 404', () => {
    const error = new NotFoundError('Recurso no encontrado');

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
  });
});
