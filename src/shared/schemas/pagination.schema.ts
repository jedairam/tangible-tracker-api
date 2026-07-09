import { z } from 'zod';

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
