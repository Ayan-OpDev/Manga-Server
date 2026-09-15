import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handle } from '@hono/node-server/vercel';

import { mangaRouter } from '../src/routes/manga.js';
import { proxyRouter } from '../src/routes/proxy.js';
import { docsRouter } from '../src/routes/docs.js';
import { UpstreamTimeoutError } from '../src/utils/fetcher.js';

export const config = { runtime: 'edge' };

const app = new Hono();

// Global Logger
app.use('*', logger());

// Full CORS support for web and mobile clients
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
  })
);

// Mount API routes
app.route('/', docsRouter);
app.route('/api', mangaRouter);
app.route('/api', proxyRouter);

// 404 Fallback
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Endpoint not found',
      path: c.req.path,
    },
    404
  );
});

// Error handling
app.onError((err, c) => {
  console.error('Unhandled server error:', err);
  if (err instanceof UpstreamTimeoutError || err.name === 'UpstreamTimeoutError' || err.message === 'Upstream timeout') {
    return c.json(
      {
        success: false,
        error: 'Upstream timeout',
      },
      504
    );
  }
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Start local dev server if executed directly in development and not running on Vercel
const isDirectExecution = Boolean(
  typeof process !== 'undefined' &&
    Array.isArray(process?.argv) &&
    process.argv[1] &&
    (process.argv[1].endsWith('api/index.ts') ||
      process.argv[1].endsWith('api\\index.ts') ||
      process.argv[1].endsWith('api/index.js') ||
      process.argv[1].endsWith('api\\index.js'))
);

if (
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'production' &&
  !process.env?.VERCEL &&
  isDirectExecution
) {
  import('@hono/node-server')
    .then(({ serve }) => {
      const port = Number(process.env?.PORT || 3000);
      serve(
        {
          fetch: app.fetch,
          port,
        },
        (info) => {
          console.log(`🚀 Tanko Manga Server running at http://localhost:${info.port}`);
        }
      );
    })
    .catch(() => {});
}

// Node.js Serverless Function adapter
const nodeHandler = handle(app);

// Universal export: handles Node.js Serverless (req, res) AND Web/Edge (Request)
export default function handler(req: any, res?: any) {
  if (res && typeof res.writeHead === 'function') {
    return nodeHandler(req, res);
  }
  return app.fetch(req);
}

// Support Web fetch API if Edge runtime is activated
handler.fetch = app.fetch;

// Export app for tests and external routers
export { app };



