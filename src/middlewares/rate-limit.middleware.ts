import rateLimit from 'express-rate-limit';
import { sendError } from '@/shared/utils/response.utils.js';

export const API_RATE_LIMIT_WINDOW_MS = 1000;
export const API_RATE_LIMIT_MAX = 100;

/** Máximo 100 peticiones por segundo por IP. */
export const apiRateLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'Demasiadas peticiones. Máximo 100 por segundo.');
  },
});
