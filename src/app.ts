import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from '@/config/cors.js';
import { env } from '@/config/env.js';
import { errorMiddleware } from '@/middlewares/error.middleware.js';
import { apiRateLimiter } from '@/middlewares/rate-limit.middleware.js';
import { metricsMiddleware } from '@/middlewares/metrics.middleware.js';
import { healthRoutes } from '@/modules/health/health.routes.js';
import { logRoutes } from '@/modules/logs/log.routes.js';
import { taskRoutes } from '@/modules/tasks/task.routes.js';
import { userRoutes } from '@/modules/users/user.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(metricsMiddleware);
  app.use(express.json({ limit: '100kb' }));

  app.use(healthRoutes);
  app.use('/api', apiRateLimiter);
  app.use('/api', logRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', userRoutes);

  app.use(errorMiddleware);

  return app;
}
