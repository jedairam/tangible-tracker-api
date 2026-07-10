import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from '@/modules/tasks/task.schema.js';

describe('createTaskSchema', () => {
  it('accepts valid payload with defaults', () => {
    const result = createTaskSchema.parse({
      title: 'Incidencia login',
      description: 'Error en producción',
    });

    expect(result).toEqual({
      title: 'Incidencia login',
      description: 'Error en producción',
      status: 'pending',
      priority: 'medium',
    });
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({
      title: '',
      description: 'Descripción válida',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('El título es obligatorio');
    }
  });

  it('rejects invalid status', () => {
    const result = createTaskSchema.safeParse({
      title: 'Tarea',
      description: 'Descripción',
      status: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('accepts partial update', () => {
    const result = updateTaskSchema.parse({ assignedUserId: null });
    expect(result).toEqual({ assignedUserId: null });
  });

  it('accepts partial update with status only', () => {
    const result = updateTaskSchema.parse({ status: 'in_progress' });
    expect(result).toEqual({ status: 'in_progress' });
  });

  it('rejects empty body', () => {
    const result = updateTaskSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Debe proporcionar al menos un campo');
    }
  });
});

describe('taskIdParamSchema', () => {
  it('accepts non-empty id', () => {
    expect(taskIdParamSchema.parse({ id: 'abc123' })).toEqual({ id: 'abc123' });
  });

  it('rejects empty id', () => {
    expect(taskIdParamSchema.safeParse({ id: '' }).success).toBe(false);
  });
});
