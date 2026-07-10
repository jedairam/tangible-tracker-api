import { Router, type Request, type Response } from 'express';
import { validateMiddleware } from '@/middlewares/validate.middleware.js';
import { parsePaginationQuery } from '@/shared/schemas/pagination.schema.js';
import { sendPaginatedList, sendSuccess } from '@/shared/utils/response.utils.js';
import { FirebaseUserRepository } from './firebase-user.repository.js';
import { UserService } from './user.service.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from './user.schema.js';

export const userService = new UserService(new FirebaseUserRepository());

export const userRoutes = Router();

//Crear un nuevo usuario
userRoutes.post('/users', validateMiddleware(createUserSchema), async (req: Request, res: Response) => {
  const user = await userService.create(req.body as CreateUserInput);
  sendSuccess(res, user, 201);
});

//Obtener todos los usuarios paginados ordenados por fecha de creación
userRoutes.get('/users', async (req: Request, res: Response) => {
  const result = await userService.findAll(parsePaginationQuery(req.query));
  sendPaginatedList(res, result);
});

//Obtener un usuario por su ID
userRoutes.get(
  '/users/:id',
  validateMiddleware(userIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    const user = await userService.findById(req.params.id as string);
    sendSuccess(res, user);
  },
);

//Actualizar un usuario
userRoutes.patch(
  '/users/:id',
  validateMiddleware(userIdParamSchema, 'params'),
  validateMiddleware(updateUserSchema),
  async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id as string, req.body as UpdateUserInput);
    sendSuccess(res, user);
  },
);

//Eliminar un usuario
userRoutes.delete(
  '/users/:id',
  validateMiddleware(userIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    await userService.delete(req.params.id as string);
    sendSuccess(res, null, 200, { message: 'Usuario eliminado' });
  },
);
