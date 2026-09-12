import { Hono } from 'hono';
import axios from 'axios';
export const proxyRouter = new Hono();
proxyRouter.get('/proxy-image', async (c) => {
    const imageUrl = c.req.query('url');
    const referer = c.req.query('referer');
    if (!imageUrl) {
        return c.json({ error: 'Missing url parameter' }, 400);
    }
    try {
        const decodedUrl = decodeURIComponent(imageUrl);
        if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
            return c.json({ error: 'Invalid URL protocol' }, 400);
        }
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        };
        if (referer) {
            headers['Referer'] = decodeURIComponent(referer);
        }
        else {
            const parsed = new URL(decodedUrl);
            headers['Referer'] = `${parsed.protocol}//${parsed.hostname}`;
        }
        const response = await axios.get(decodedUrl, {
            responseType: 'arraybuffer',
            headers,
            timeout: 15000,
        });
        const contentType = String(response.headers['content-type'] || 'image/jpeg');
        c.header('Content-Type', contentType);
        c.header('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
        c.header('Access-Control-Allow-Origin', '*');
        return c.body(response.data);
    }
    catch (error) {
        return c.json({
            error: 'Failed to proxy image',
            message: error.message,
        }, 502);
    }
});
