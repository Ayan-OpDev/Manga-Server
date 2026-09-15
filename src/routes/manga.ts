import { Hono } from 'hono';
import { registry } from '../providers/index.js';
import { UpstreamTimeoutError } from '../utils/fetcher.js';

export const mangaRouter = new Hono();

const VERCEL_EDGE_CACHE_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';

function getRequestOrigin(c: any): string {
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || 'localhost:3000';
  const proto = c.req.header('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

function handleRouteError(c: any, fallbackMessage: string, error: any) {
  if (error instanceof UpstreamTimeoutError || error?.name === 'UpstreamTimeoutError' || error?.message === 'Upstream timeout') {
    return c.json({ success: false, error: 'Upstream timeout' }, 504);
  }
  return c.json(
    { success: false, error: fallbackMessage, message: error?.message },
    500
  );
}

// Health Check
mangaRouter.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: registry.list(),
  });
});

// Search Manga
mangaRouter.get('/search', async (c) => {
  const query = c.req.query('q');
  const page = Number(c.req.query('page') || '1');
  const providerName = c.req.query('provider');

  if (!query) {
    return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
  }

  try {
    const provider = registry.get(providerName);
    const data = await provider.search(query, page);
    c.header('Cache-Control', VERCEL_EDGE_CACHE_HEADER);
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Search failed', error);
  }
});

// Popular / Trending Manga
mangaRouter.get('/popular', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getPopular(page);
    c.header('Cache-Control', VERCEL_EDGE_CACHE_HEADER);
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Failed to fetch popular manga', error);
  }
});

// Latest Releases
mangaRouter.get('/latest', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getLatest(page);
    c.header('Cache-Control', VERCEL_EDGE_CACHE_HEADER);
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Failed to fetch latest manga', error);
  }
});

// Manga Info
mangaRouter.get('/manga/:id', async (c) => {
  const id = c.req.param('id');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getMangaInfo(id);
    c.header('Cache-Control', VERCEL_EDGE_CACHE_HEADER);
    return c.json({
      success: true,
      provider: provider.name,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Failed to fetch manga info', error);
  }
});

// Chapter List
mangaRouter.get('/chapters/:id', async (c) => {
  const id = c.req.param('id');
  const providerName = c.req.query('provider');
  const lang = c.req.query('lang') || 'en';

  try {
    const provider = registry.get(providerName);
    const data = await provider.getChapters(id, lang);
    return c.json({
      success: true,
      provider: provider.name,
      count: data.length,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Failed to fetch chapters', error);
  }
});

// Chapter Pages
mangaRouter.get('/pages/:chapterId', async (c) => {
  const chapterId = c.req.param('chapterId');
  const providerName = c.req.query('provider');
  const origin = getRequestOrigin(c);

  try {
    const provider = registry.get(providerName);
    const data = await provider.getPages(chapterId, origin);
    return c.json({
      success: true,
      provider: provider.name,
      chapterId,
      pagesCount: data.length,
      data,
    });
  } catch (error: any) {
    return handleRouteError(c, 'Failed to fetch chapter pages', error);
  }
});
