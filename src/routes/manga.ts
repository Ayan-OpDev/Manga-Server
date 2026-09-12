import { Hono } from 'hono';
import { registry } from '../providers/index.js';

export const mangaRouter = new Hono();

function getRequestOrigin(c: any): string {
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || 'localhost:3000';
  const proto = c.req.header('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
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
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return c.json(
      { success: false, error: 'Search failed', message: error.message },
      500
    );
  }
});

// Popular / Trending Manga
mangaRouter.get('/popular', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getPopular(page);
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return c.json(
      { success: false, error: 'Failed to fetch popular manga', message: error.message },
      500
    );
  }
});

// Latest Releases
mangaRouter.get('/latest', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getLatest(page);
    return c.json({
      success: true,
      provider: provider.name,
      page,
      results: data.length,
      data,
    });
  } catch (error: any) {
    return c.json(
      { success: false, error: 'Failed to fetch latest manga', message: error.message },
      500
    );
  }
});

// Manga Info
mangaRouter.get('/manga/:id', async (c) => {
  const id = c.req.param('id');
  const providerName = c.req.query('provider');

  try {
    const provider = registry.get(providerName);
    const data = await provider.getMangaInfo(id);
    return c.json({
      success: true,
      provider: provider.name,
      data,
    });
  } catch (error: any) {
    return c.json(
      { success: false, error: 'Failed to fetch manga info', message: error.message },
      500
    );
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
    return c.json(
      { success: false, error: 'Failed to fetch chapters', message: error.message },
      500
    );
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
    return c.json(
      { success: false, error: 'Failed to fetch chapter pages', message: error.message },
      500
    );
  }
});
