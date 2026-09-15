import { serve } from '@hono/node-server';
import app from './src/app.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Starting local dev server on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
