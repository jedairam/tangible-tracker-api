import { describe, expect, it, vi } from 'vitest';
import { metricsMiddleware } from '@/middlewares/metrics.middleware.js';
import { createMockNext, createMockRequest, createMockResponse } from '../../helpers/mock-express.js';

describe('metricsMiddleware', () => {
  it('registra métrica al finalizar la respuesta', () => {
    const req = createMockRequest({ method: 'GET', originalUrl: '/api/tasks' });
    const res = createMockResponse();
    const next = createMockNext();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    let finishHandler: (() => void) | undefined;
    vi.mocked(res.on).mockImplementation((event: string, handler: () => void) => {
      if (event === 'finish') {
        finishHandler = handler;
      }
      return res;
    });

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    finishHandler?.();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[METRIC\] GET \/api\/tasks \d+ms$/),
    );

    consoleSpy.mockRestore();
  });
});
