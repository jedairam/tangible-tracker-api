import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { logRoutes } from './modules/logs/log.routes.js';
import { taskRoutes } from './modules/tasks/task.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(morgan('dev'));
  app.use(metricsMiddleware);
  app.use(express.json());

  app.use(healthRoutes);
  app.use('/api', logRoutes);
  app.use('/api', taskRoutes);

  app.use(errorMiddleware);

  return app;
}
