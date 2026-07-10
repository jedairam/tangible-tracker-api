import { describe, expect, it } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '@/modules/users/user.schema.js';

describe('createUserSchema', () => {
  it('accepts valid payload', () => {
    const result = createUserSchema.parse({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
    });

    expect(result).toEqual({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
    });
  });

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts partial update', () => {
    const result = updateUserSchema.parse({ firstName: 'Pedro' });
    expect(result).toEqual({ firstName: 'Pedro' });
  });

  it('rejects empty body', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('userIdParamSchema', () => {
  it('accepts non-empty id', () => {
    expect(userIdParamSchema.parse({ id: 'abc123' })).toEqual({ id: 'abc123' });
  });
});
