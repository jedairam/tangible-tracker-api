//Estados  de las tareas
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

//Prioridades posibles de las tareas
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

//Etiquetas para los estados de las tareas
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'pendiente',
  in_progress: 'en progreso',
  completed: 'completada',
  cancelled: 'cancelada',
};

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}
