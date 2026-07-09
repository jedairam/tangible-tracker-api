import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { healthRoutes } from './modules/health/health.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(morgan('dev'));
  app.use(express.json());

  app.use(healthRoutes);

  return app;
}
