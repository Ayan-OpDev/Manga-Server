export type MangaProviderName = 'mangadex' | 'mangaread' | 'manganato';

export interface MangaItem {
  id: string;
  title: string;
  altTitles?: string[];
  description?: string;
  cover?: string;
  authors?: string[];
  status?: string;
  genres?: string[];
  latestChapter?: string;
  provider: MangaProviderName;
}

export interface ChapterItem {
  id: string;
  number: number | string;
  title: string;
  lang?: string;
  publishDate?: string;
  pagesCount?: number;
}

export interface PageItem {
  page: number;
  imageUrl: string;
  directUrl: string;
}

export interface MangaDetails extends MangaItem {
  chapters?: ChapterItem[];
}

export interface MangaProvider {
  name: MangaProviderName;
  search(query: string, page?: number): Promise<MangaItem[]>;
  getPopular(page?: number): Promise<MangaItem[]>;
  getLatest(page?: number): Promise<MangaItem[]>;
  getMangaInfo(id: string): Promise<MangaItem>;
  getChapters(id: string, lang?: string): Promise<ChapterItem[]>;
  getPages(chapterId: string, origin?: string): Promise<PageItem[]>;
}
