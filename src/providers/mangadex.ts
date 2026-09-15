import type { MangaProvider, MangaItem, ChapterItem, PageItem, MangaProviderName } from '../types/index.js';
import { fetchJson } from '../utils/fetcher.js';

export class MangaDexProvider implements MangaProvider {
  public name: MangaProviderName = 'mangadex';
  private baseUrl = 'https://api.mangadex.org';
  private coverBaseUrl = 'https://uploads.mangadex.org/covers';

  private extractCover(mangaId: string, relationships: any[] = []): string | undefined {
    const coverArt = relationships.find((rel) => rel.type === 'cover_art');
    if (coverArt?.attributes?.fileName) {
      return `${this.coverBaseUrl}/${mangaId}/${coverArt.attributes.fileName}.512.jpg`;
    }
    return undefined;
  }

  private extractAuthors(relationships: any[] = []): string[] {
    return relationships
      .filter((rel) => rel.type === 'author' || rel.type === 'artist')
      .map((rel) => rel.attributes?.name)
      .filter(Boolean);
  }

  private formatManga(data: any): MangaItem {
    const { id, attributes, relationships = [] } = data;
    const title =
      attributes.title?.en ||
      Object.values(attributes.title || {})[0] ||
      'Unknown Title';

    const description =
      attributes.description?.en ||
      Object.values(attributes.description || {})[0] ||
      '';

    const altTitles = (attributes.altTitles || [])
      .map((t: Record<string, string>) => Object.values(t)[0])
      .filter(Boolean);

    const genres = (attributes.tags || [])
      .filter((tag: any) => tag.attributes?.group === 'genre' || tag.attributes?.group === 'theme')
      .map((tag: any) => tag.attributes?.name?.en)
      .filter(Boolean);

    return {
      id,
      title: String(title),
      altTitles,
      description: String(description),
      cover: this.extractCover(id, relationships),
      authors: this.extractAuthors(relationships),
      status: attributes.status,
      genres,
      latestChapter: attributes.latestUploadedChapter,
      provider: this.name,
    };
  }

  private buildFeedParams(limit: number, offset: number, lang?: string): URLSearchParams {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (lang && lang !== 'all') {
      params.append('translatedLanguage[]', lang);
    }
    params.append('order[chapter]', 'desc');
    params.append('includeExternalUrl', '0');
    params.append('includeEmptyPages', '0');
    return params;
  }

  private parseChapterItems(items: any[]): ChapterItem[] {
    return items.map((item: any) => {
      const { id: chapterId, attributes } = item;
      const chapterNum = attributes.chapter || '0';
      const title = attributes.title
        ? `Ch. ${chapterNum} - ${attributes.title}`
        : `Chapter ${chapterNum}`;

      return {
        id: chapterId,
        number: Number.isNaN(Number(chapterNum)) ? chapterNum : Number(chapterNum),
        title,
        lang: attributes.translatedLanguage,
        publishDate: attributes.publishAt,
        pagesCount: attributes.pages,
      };
    });
  }

  async search(query: string, page = 1): Promise<MangaItem[]> {
    const limit = 20;
    const offset = (page - 1) * limit;

    const params = new URLSearchParams();
    params.append('title', query);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.append('contentRating[]', 'erotica');

    const res = await fetchJson<any>(`${this.baseUrl}/manga?${params.toString()}`);
    return (res?.data || []).map((item: any) => this.formatManga(item));
  }

  async getPopular(page = 1): Promise<MangaItem[]> {
    const limit = 20;
    const offset = (page - 1) * limit;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    params.append('order[followedCount]', 'desc');
    params.append('order[rating]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');

    const res = await fetchJson<any>(`${this.baseUrl}/manga?${params.toString()}`);
    return (res?.data || []).map((item: any) => this.formatManga(item));
  }

  async getLatest(page = 1): Promise<MangaItem[]> {
    const limit = 20;
    const offset = (page - 1) * limit;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    params.append('order[latestUploadedChapter]', 'desc');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');

    const res = await fetchJson<any>(`${this.baseUrl}/manga?${params.toString()}`);
    return (res?.data || []).map((item: any) => this.formatManga(item));
  }

  async getMangaInfo(id: string): Promise<MangaItem> {
    const params = new URLSearchParams();
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');

    const res = await fetchJson<any>(`${this.baseUrl}/manga/${id}?${params.toString()}`);
    return this.formatManga(res.data);
  }

  async getChapters(id: string, lang = 'en'): Promise<ChapterItem[]> {
    const limit = 100;
    const firstParams = this.buildFeedParams(limit, 0, lang);
    const firstRes = await fetchJson<any>(`${this.baseUrl}/manga/${id}/feed?${firstParams.toString()}`);

    const total = firstRes?.total || 0;
    const allItems = [...(firstRes?.data || [])];

    // If there are more chapters than the first page, fetch remaining concurrently
    if (total > limit) {
      const offsets: number[] = [];
      for (let offset = limit; offset < total; offset += limit) {
        offsets.push(offset);
      }

      const remainingPromises = offsets.map((offset) => {
        const params = this.buildFeedParams(limit, offset, lang);
        return fetchJson<any>(`${this.baseUrl}/manga/${id}/feed?${params.toString()}`);
      });

      const remainingResults = await Promise.all(remainingPromises);
      for (const result of remainingResults) {
        if (result?.data) {
          allItems.push(...result.data);
        }
      }
    }

    return this.parseChapterItems(allItems);
  }

  async getPages(chapterId: string, origin = ''): Promise<PageItem[]> {
    const res = await fetchJson<any>(`${this.baseUrl}/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = res;
    const hash = chapter.hash;
    const files: string[] = chapter.data || [];

    return files.map((fileName, index) => {
      const directUrl = `${baseUrl}/data/${hash}/${fileName}`;
      const encodedUrl = encodeURIComponent(directUrl);
      const encodedRef = encodeURIComponent('https://mangadex.org');
      const imageUrl = `${origin}/api/proxy-image?url=${encodedUrl}&referer=${encodedRef}`;

      return {
        page: index + 1,
        imageUrl,
        directUrl,
      };
    });
  }
}
