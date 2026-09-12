import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { handle } from 'hono/vercel';

import { mangaRouter } from '../src/routes/manga.js';
import { proxyRouter } from '../src/routes/proxy.js';
import { docsRouter } from '../src/routes/docs.js';

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
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Start local dev server if not running on Vercel
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`🚀 Tanko Manga Server running at http://localhost:${info.port}`);
    }
  );
}

// Export for Vercel Serverless Function
export default handle(app);
