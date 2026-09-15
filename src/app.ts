import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { mangaRouter } from './routes/manga.js';
import { proxyRouter } from './routes/proxy.js';
import { docsRouter } from './routes/docs.js';
import { UpstreamTimeoutError } from './utils/fetcher.js';

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

// Global Error handling
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

export default app;
