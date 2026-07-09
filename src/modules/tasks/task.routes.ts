import { Router, type Request, type Response } from 'express';
import { validateMiddleware } from '@/middlewares/validate.middleware.js';
import { parsePaginationQuery } from '@/shared/schemas/pagination.schema.js';
import { sendPaginatedList, sendSuccess } from '@/shared/utils/response.utils.js';
import { logService } from '@/modules/logs/log.routes.js';
import { FirebaseTaskRepository } from './firebase-task.repository.js';
import { TaskService } from './task.service.js';
import {
  createTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from './task.schema.js';

const taskService = new TaskService(new FirebaseTaskRepository(), logService);

export const taskRoutes = Router();

taskRoutes.post('/tasks', validateMiddleware(createTaskSchema), async (req: Request, res: Response) => {
  const task = await taskService.create(req.body as CreateTaskInput);
  sendSuccess(res, task, 201);
});

taskRoutes.get('/tasks', async (req: Request, res: Response) => {
  const result = await taskService.findAll(parsePaginationQuery(req.query));
  sendPaginatedList(res, result);
});

taskRoutes.get(
  '/tasks/:id',
  validateMiddleware(taskIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const task = await taskService.findById(req.params.id as string);
    sendSuccess(res, task);
  },
);

taskRoutes.patch(
  '/tasks/:id',
  validateMiddleware(taskIdParamSchema, 'params'),
  validateMiddleware(updateTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.update(req.params.id as string, req.body as UpdateTaskInput);
    sendSuccess(res, task);
  },
);

taskRoutes.delete(
  '/tasks/:id',
  validateMiddleware(taskIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    await taskService.delete(req.params.id as string);
    sendSuccess(res, null, 200, { message: 'Tarea eliminada' });
  },
);
