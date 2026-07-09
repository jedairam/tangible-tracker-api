import { Router } from 'express';
import { checkFirestoreConnection } from '../../config/firebase.js';
import { env } from '../../config/env.js';

export const healthRoutes = Router();

// GET /health — Verifica el estado del servidor y la conexión con Firestore
healthRoutes.get('/health', async (_req, res) => {
  const databaseConnected = await checkFirestoreConnection();

  const payload = {
    status: databaseConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: databaseConnected ? 'connected' : 'disconnected',
  };

  res.status(databaseConnected ? 200 : 503).json(payload);
});
