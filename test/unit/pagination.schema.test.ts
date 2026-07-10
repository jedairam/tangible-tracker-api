import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/shared/errors/validation.error.js';
import {
  paginationQuerySchema,
  parsePaginationQuery,
} from '../../src/shared/schemas/pagination.schema.js';

describe('paginationQuerySchema', () => {
  it('applies defaults when query is empty', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('coerces string query params', () => {
    expect(paginationQuerySchema.parse({ page: '2', limit: '10' })).toEqual({
      page: 2,
      limit: 10,
    });
  });

  it('rejects limit above 100', () => {
    expect(paginationQuerySchema.safeParse({ page: 1, limit: 101 }).success).toBe(false);
  });

  it('rejects page below 1', () => {
    expect(paginationQuerySchema.safeParse({ page: 0, limit: 20 }).success).toBe(false);
  });

  it('parsePaginationQuery throws ValidationError on invalid input', () => {
    expect(() => parsePaginationQuery({ page: 0, limit: 20 })).toThrow(ValidationError);
  });
});
