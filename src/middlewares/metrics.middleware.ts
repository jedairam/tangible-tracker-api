import type { NextFunction, Request, Response } from 'express';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();

  res.on('finish', () => {
    const duration = Math.round(performance.now() - start);
    console.log(`[METRIC] ${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
}
