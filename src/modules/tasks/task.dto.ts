import type { TaskPriority, TaskStatus } from './task.model.js';

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId?: string | null | undefined;
}

export interface UpdateTaskDto {
  title?: string | undefined;
  description?: string | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  assignedUserId?: string | null | undefined;
}
