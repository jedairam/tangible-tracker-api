//Acciones para los logs
export const LOG_ACTIONS = {
  TASK_CREATED: 'Tarea creada',
  TASK_UPDATED: 'Tarea actualizada',
  TASK_DELETED: 'Tarea eliminada',
  STATUS_CHANGED: 'Estado cambiado',
} as const;

export type LogAction = (typeof LOG_ACTIONS)[keyof typeof LOG_ACTIONS];

export interface Log {
  id: string;
  taskId: string;
  taskCode: string;
  action: string;
  detail: string;
  createdAt: Date;
}
