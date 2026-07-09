import { z } from 'zod';
import { ValidationError } from '@/shared/errors/validation.error.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'La página debe ser mayor o igual a 1').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El límite debe ser mayor o igual a 1')
    .max(100, 'El límite máximo es 100')
    .default(20),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export function parsePaginationQuery(query: unknown): PaginationQueryInput {
  const result = paginationQuerySchema.safeParse(query);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new ValidationError(message);
  }

  return result.data;
}
