import type { Task } from '@/modules/tasks/task.model.js';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    code: 'TAN-1',
    title: 'Incidencia login',
    description: 'Error en producción',
    status: 'pending',
    priority: 'medium',
    assignedUserId: null,
    createdAt: new Date('2026-07-09T00:00:00.000Z'),
    updatedAt: new Date('2026-07-09T00:00:00.000Z'),
    ...overrides,
  };
}
