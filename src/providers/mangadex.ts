import axios from 'axios';
import type { MangaProvider, MangaItem, ChapterItem, PageItem, MangaProviderName } from '../types/index.js';

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

    const res = await axios.get(`${this.baseUrl}/manga`, { params, timeout: 10000 });
    return (res.data?.data || []).map((item: any) => this.formatManga(item));
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

    const res = await axios.get(`${this.baseUrl}/manga`, { params, timeout: 10000 });
    return (res.data?.data || []).map((item: any) => this.formatManga(item));
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

    const res = await axios.get(`${this.baseUrl}/manga`, { params, timeout: 10000 });
    return (res.data?.data || []).map((item: any) => this.formatManga(item));
  }

  async getMangaInfo(id: string): Promise<MangaItem> {
    const params = new URLSearchParams();
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');

    const res = await axios.get(`${this.baseUrl}/manga/${id}`, { params, timeout: 10000 });
    return this.formatManga(res.data.data);
  }

  async getChapters(id: string, lang = 'en'): Promise<ChapterItem[]> {
    const limit = 100;
    let offset = 0;
    const chapters: ChapterItem[] = [];

    // Up to 3 batches to respect serverless timeouts
    for (let batch = 0; batch < 3; batch++) {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      if (lang && lang !== 'all') {
        params.append('translatedLanguage[]', lang);
      }
      params.append('order[chapter]', 'desc');
      params.append('includeExternalUrl', '0');
      params.append('includeEmptyPages', '0');

      const res = await axios.get(`${this.baseUrl}/manga/${id}/feed`, { params, timeout: 10000 });
      const items = res.data?.data || [];
      for (const item of items) {
        const { id: chapterId, attributes } = item;
        const chapterNum = attributes.chapter || '0';
        const title = attributes.title
          ? `Ch. ${chapterNum} - ${attributes.title}`
          : `Chapter ${chapterNum}`;

        chapters.push({
          id: chapterId,
          number: Number.isNaN(Number(chapterNum)) ? chapterNum : Number(chapterNum),
          title,
          lang: attributes.translatedLanguage,
          publishDate: attributes.publishAt,
          pagesCount: attributes.pages,
        });
      }

      if (chapters.length >= (res.data?.total || 0) || items.length < limit) {
        break;
      }
      offset += limit;
    }

    return chapters;
  }

  async getPages(chapterId: string, origin = ''): Promise<PageItem[]> {
    const res = await axios.get(`${this.baseUrl}/at-home/server/${chapterId}`, { timeout: 10000 });
    const { baseUrl, chapter } = res.data;
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
