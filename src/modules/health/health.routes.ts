import { Router } from 'express';
import { checkFirestoreConnection } from '@/config/firebase.js';
import { env } from '@/config/env.js';
import { sendSuccess } from '@/shared/utils/response.utils.js';

export const healthRoutes = Router();

healthRoutes.get('/health', async (_req, res) => {
  const databaseConnected = await checkFirestoreConnection();

  const payload = {
    status: databaseConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: databaseConnected ? 'connected' : 'disconnected',
  };

  sendSuccess(res, payload, databaseConnected ? 200 : 503);
});
