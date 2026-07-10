import type { Log } from '@/modules/logs/log.model.js';

export function makeLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    taskId: 'task-1',
    taskCode: 'TAN-1',
    action: 'Tarea creada',
    detail: 'Tarea "Incidencia login" creada',
    createdAt: new Date('2026-07-09T00:00:00.000Z'),
    ...overrides,
  };
}
