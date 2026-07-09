import { Router, type Request, type Response } from 'express';
import { sendList } from '../../shared/utils/response.utils.js';
import { FirebaseLogRepository } from './firebase-log.repository.js';
import { LogService } from './log.service.js';

export const logService = new LogService(new FirebaseLogRepository());

export const logRoutes = Router();

logRoutes.get('/logs', async (_req: Request, res: Response) => {
  const logs = await logService.findAll();
  sendList(res, logs);
});

logRoutes.get('/logs/stream', (req: Request, res: Response) => {
  logService.subscribe(res);
});
