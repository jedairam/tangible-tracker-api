import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Carga `.env.test` y devuelve las variables como strings (sin mutar `process.env`). */
export function loadTestEnv(): Record<string, string> {
  const { parsed, error } = config({
    path: path.join(rootDir, '.env.test'),
    processEnv: {},
  });

  if (error) {
    throw error;
  }

  if (!parsed) {
    throw new Error('No se pudo leer .env.test');
  }

  return parsed as Record<string, string>;
}
