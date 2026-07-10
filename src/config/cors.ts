import type { CorsOptions } from 'cors';
import { env } from './env.js';

function isAllowedLocalOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Peticiones sin Origin (curl, health checks, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin === env.CORS_ORIGIN && isAllowedLocalOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
