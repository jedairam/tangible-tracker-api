import { createApp } from '@/app.js';
import { env } from '@/config/env.js';
import { initFirebase } from '@/config/firebase.js';

async function bootstrap() {
  initFirebase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
