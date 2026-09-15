import * as cheerio from 'cheerio';
import { Redis } from '@upstash/redis';
import type { MangaProvider, MangaItem, ChapterItem, PageItem, MangaProviderName } from '../types/index.js';
import { fetchText } from '../utils/fetcher.js';

export class ManganatoProvider implements MangaProvider {
  public name: MangaProviderName = 'manganato';
  private baseUrl = 'https://www.mangaread.org';
  private defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  private redis: Redis | null = null;

  constructor() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  private extractSlugFromUrl(url: string): string {
    const match = url.match(/\/manga\/([^/]+)\/?/);
    return match ? match[1] : encodeURIComponent(url);
  }

  /**
   * Checks Redis for cached parsed JSON. If missing, fetches HTML, parses via callback,
   * stores in Redis with a 2-hour TTL (7200s), and returns the parsed result.
   */
  private async fetchAndParseWithCache<T>(
    url: string,
    parser: (html: string) => T
  ): Promise<T> {
    const cacheKey = `manganato:${url}`;

    if (this.redis) {
      try {
        const cached = await this.redis.get<T>(cacheKey);
        if (cached) {
          return typeof cached === 'string' ? JSON.parse(cached) : cached;
        }
      } catch (err) {
        console.warn(`[Redis] Cache read failed for key ${cacheKey}:`, err);
      }
    }

    const html = await fetchText(url, { headers: this.defaultHeaders });
    const parsedData = parser(html);

    if (this.redis) {
      try {
        await this.redis.set(cacheKey, parsedData, { ex: 7200 });
      } catch (err) {
        console.warn(`[Redis] Cache write failed for key ${cacheKey}:`, err);
      }
    }

    return parsedData;
  }

  async search(query: string, page = 1): Promise<MangaItem[]> {
    const url = `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;

    return this.fetchAndParseWithCache(url, (html) => {
      const $ = cheerio.load(html);
      const results: MangaItem[] = [];

      $('div.c-tabs-item__content, div.row.c-tabs-item__content').each((_, el) => {
        const titleAnchor = $(el).find('.post-title a');
        const title = titleAnchor.text().trim();
        const href = titleAnchor.attr('href') || '';
        const id = this.extractSlugFromUrl(href);
        const img = $(el).find('.tab-thumb img');
        const cover = img.attr('data-src') || img.attr('src');
        const latestChapter = $(el).find('.latest-chap .chapter a').text().trim();
        const authors = $(el).find('.mg_author .summary-content a').map((_, a) => $(a).text().trim()).get();
        const genres = $(el).find('.mg_genres .summary-content a').map((_, a) => $(a).text().trim()).get();

        if (title && id) {
          results.push({
            id,
            title,
            cover,
            latestChapter,
            authors: authors.length ? authors : undefined,
            genres: genres.length ? genres : undefined,
            provider: this.name,
          });
        }
      });

      return results;
    });
  }

  async getPopular(page = 1): Promise<MangaItem[]> {
    const url = `${this.baseUrl}/manga/page/${page}/?m_orderby=views`;

    return this.fetchAndParseWithCache(url, (html) => {
      const $ = cheerio.load(html);
      const results: MangaItem[] = [];

      $('div.page-item-detail, div.col-6.col-md-3.badge-pos-1').each((_, el) => {
        const anchor = $(el).find('.post-title a, h3 a');
        const title = anchor.text().trim();
        const href = anchor.attr('href') || '';
        const id = this.extractSlugFromUrl(href);
        const img = $(el).find('img');
        const cover = img.attr('data-src') || img.attr('src');
        const latestChapter = $(el).find('.chapter-item .chapter a').first().text().trim();

        if (title && id) {
          results.push({
            id,
            title,
            cover,
            latestChapter,
            provider: this.name,
          });
        }
      });

      return results;
    });
  }

  async getLatest(page = 1): Promise<MangaItem[]> {
    const url = `${this.baseUrl}/manga/page/${page}/?m_orderby=latest`;

    return this.fetchAndParseWithCache(url, (html) => {
      const $ = cheerio.load(html);
      const results: MangaItem[] = [];

      $('div.page-item-detail, div.col-6.col-md-3.badge-pos-1').each((_, el) => {
        const anchor = $(el).find('.post-title a, h3 a');
        const title = anchor.text().trim();
        const href = anchor.attr('href') || '';
        const id = this.extractSlugFromUrl(href);
        const img = $(el).find('img');
        const cover = img.attr('data-src') || img.attr('src');
        const latestChapter = $(el).find('.chapter-item .chapter a').first().text().trim();

        if (title && id) {
          results.push({
            id,
            title,
            cover,
            latestChapter,
            provider: this.name,
          });
        }
      });

      return results;
    });
  }

  async getMangaInfo(id: string): Promise<MangaItem> {
    const url = `${this.baseUrl}/manga/${id}/`;

    return this.fetchAndParseWithCache(url, (html) => {
      const $ = cheerio.load(html);
      const title = $('div.post-title h1').text().trim();
      const coverImg = $('div.summary_image img');
      const cover = coverImg.attr('data-src') || coverImg.attr('src');
      const description = $('div.description-summary div.summary__content').text().trim();

      const authors = $('div.author-content a').map((_, a) => $(a).text().trim()).get();
      const genres = $('div.genres-content a').map((_, a) => $(a).text().trim()).get();
      const status = $('div.post-status div.summary-content').first().text().trim();

      return {
        id,
        title: title || id,
        description,
        cover,
        authors: authors.length ? authors : undefined,
        genres: genres.length ? genres : undefined,
        status: status || undefined,
        provider: this.name,
      };
    });
  }

  async getChapters(id: string, _lang = 'en'): Promise<ChapterItem[]> {
    const url = `${this.baseUrl}/manga/${id}/`;

    return this.fetchAndParseWithCache(url, (html) => {
      const $ = cheerio.load(html);
      const chapters: ChapterItem[] = [];

      $('li.wp-manga-chapter a').each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr('href') || '';
        const match = href.match(/\/manga\/([^/]+)\/([^/]+)\/?/);
        if (match) {
          const chapterId = `${match[1]}__${match[2]}`;
          const numMatch = title.match(/chapter\s*([\d.]+)/i) || match[2].match(/chapter-([\d.]+)/i);
          const number = numMatch ? Number(numMatch[1]) : title;

          chapters.push({
            id: chapterId,
            number,
            title,
            lang: 'en',
          });
        }
      });

      return chapters;
    });
  }

  async getPages(chapterId: string, origin = ''): Promise<PageItem[]> {
    const [mangaSlug, chapterSlug] = chapterId.split('__');
    const url = chapterSlug
      ? `${this.baseUrl}/manga/${mangaSlug}/${chapterSlug}/`
      : `${this.baseUrl}/manga/${chapterId}/`;

    interface RawPageItem {
      page: number;
      directUrl: string;
    }

    const rawPages = await this.fetchAndParseWithCache<RawPageItem[]>(url, (html) => {
      const $ = cheerio.load(html);
      const pages: RawPageItem[] = [];

      $('div.page-break img, div.reading-content img').each((index, el) => {
        const src = $(el).attr('src')?.trim() || $(el).attr('data-src')?.trim();
        if (src && !src.includes('placeholder')) {
          const directUrl = src.startsWith('//') ? `https:${src}` : src;
          pages.push({
            page: index + 1,
            directUrl,
          });
        }
      });

      return pages;
    });

    return rawPages.map((item) => {
      const encodedUrl = encodeURIComponent(item.directUrl);
      const encodedRef = encodeURIComponent(this.baseUrl);
      const imageUrl = `${origin}/api/proxy-image?url=${encodedUrl}&referer=${encodedRef}`;

      return {
        page: item.page,
        imageUrl,
        directUrl: item.directUrl,
      };
    });
  }
}
