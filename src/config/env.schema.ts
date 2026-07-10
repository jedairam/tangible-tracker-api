import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((key) => key.replace(/\\n/g, '\n')),
  CORS_ORIGIN: z
    .string()
    .url('CORS_ORIGIN debe ser una URL válida')
    .default('http://localhost:5173')
    .refine(
      (url) => {
        const { hostname } = new URL(url);
        return hostname === 'localhost' || hostname === '127.0.0.1';
      },
      { message: 'CORS_ORIGIN debe apuntar a localhost o 127.0.0.1' },
    ),
});

