import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from './task.model.js';

const assignedUserIdSchema = z.union([z.string().min(1, 'El id del usuario no puede estar vacío'), z.null()]);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  status: z.enum(TASK_STATUSES).default('pending'),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  assignedUserId: assignedUserIdSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1, 'El título no puede estar vacío'),
    description: z.string().min(1, 'La descripción no puede estar vacía'),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    assignedUserId: assignedUserIdSchema.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo',
  });

export const taskIdParamSchema = z.object({
  id: z.string().min(1, 'El id de la tarea es obligatorio'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
