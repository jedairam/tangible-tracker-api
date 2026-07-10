import { describe, expect, it } from 'vitest';
import { envSchema } from '@/config/env.schema.js';
import { loadTestEnv } from '../../helpers/load-test-env.js';

const validEnv = loadTestEnv();

describe('envSchema', () => {
  it('parsea variables válidas desde .env.test', () => {
    const result = envSchema.parse(validEnv);

    expect(result.PORT).toBe(Number(validEnv.PORT));
    expect(result.CORS_ORIGIN).toBe(validEnv.CORS_ORIGIN);
    expect(result.FIREBASE_PROJECT_ID).toBe(validEnv.FIREBASE_PROJECT_ID);
    expect(result.FIREBASE_PRIVATE_KEY).toContain('\n');
  });

  it('usa CORS_ORIGIN por defecto en localhost', () => {
    const { CORS_ORIGIN: _ignored, ...rest } = validEnv;
    const result = envSchema.parse(rest);

    expect(result.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('rechaza CORS_ORIGIN que no sea local', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      CORS_ORIGIN: 'https://evil.example.com',
    });

    expect(result.success).toBe(false);
  });

  it('rechaza si falta FIREBASE_PROJECT_ID', () => {
    const { FIREBASE_PROJECT_ID: _ignored, ...rest } = validEnv;
    const result = envSchema.safeParse(rest);

    expect(result.success).toBe(false);
  });
});
