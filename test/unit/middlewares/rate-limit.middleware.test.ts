import { describe, expect, it } from 'vitest';
import {
  API_RATE_LIMIT_MAX,
  API_RATE_LIMIT_WINDOW_MS,
} from '@/middlewares/rate-limit.middleware.js';

describe('apiRateLimiter', () => {
  it('limita a 100 peticiones por segundo', () => {
    expect(API_RATE_LIMIT_WINDOW_MS).toBe(1000);
    expect(API_RATE_LIMIT_MAX).toBe(100);
  });
});
