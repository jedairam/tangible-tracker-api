import { Router, type Request, type Response } from 'express';
import { validateMiddleware } from '@/middlewares/validate.middleware.js';
import { parsePaginationQuery } from '@/shared/schemas/pagination.schema.js';
import { sendPaginatedList } from '@/shared/utils/response.utils.js';
import { FirebaseLogRepository } from './firebase-log.repository.js';
import { LogService } from './log.service.js';

export const logService = new LogService(new FirebaseLogRepository());

export const logRoutes = Router();

logRoutes.get('/logs', async (req: Request, res: Response) => {
  const result = await logService.findAll(parsePaginationQuery(req.query));
  sendPaginatedList(res, result);
});

logRoutes.get('/logs/stream', (req: Request, res: Response) => {
  logService.subscribe(res);
});
