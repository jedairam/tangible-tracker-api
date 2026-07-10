import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env.js', () => ({
  env: { CORS_ORIGIN: 'http://localhost:5173' },
}));

describe('corsOptions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadCors() {
    const { corsOptions } = await import('@/config/cors.js');
    return corsOptions;
  }

  function assertOrigin(
    corsOptions: Awaited<ReturnType<typeof loadCors>>,
    origin: string | undefined,
    allowed: boolean,
  ) {
    return new Promise<void>((resolve, reject) => {
      corsOptions.origin?.(origin, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        expect(result).toBe(allowed);
        resolve();
      });
    });
  }

  it('permite el origen configurado en localhost', async () => {
    const corsOptions = await loadCors();
    await assertOrigin(corsOptions, 'http://localhost:5173', true);
  });

  it('rechaza orígenes no permitidos', async () => {
    const corsOptions = await loadCors();
    await assertOrigin(corsOptions, 'http://localhost:3000', false);
  });

  it('permite peticiones sin header Origin', async () => {
    const corsOptions = await loadCors();
    await assertOrigin(corsOptions, undefined, true);
  });
});
