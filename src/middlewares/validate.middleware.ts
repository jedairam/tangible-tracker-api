import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@/shared/errors/validation.error.js';

type RequestSource = 'body' | 'params';

export function validateMiddleware(schema: ZodType, source: RequestSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      next(new ValidationError(message));
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      Object.assign(req.params as object, result.data);
    }

    next();
  };
}
