import type { MangaProvider, MangaProviderName } from '../types/index.js';
import { MangaDexProvider } from './mangadex.js';
import { ManganatoProvider } from './manganato.js';

class ProviderRegistry {
  private providers: Map<string, MangaProvider> = new Map();

  constructor() {
    const mangadex = new MangaDexProvider();
    const manganato = new ManganatoProvider();

    this.register(mangadex);
    this.register(manganato);
    // Aliases
    this.providers.set('mangaread', manganato);
  }

  register(provider: MangaProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name?: string): MangaProvider {
    const key = (name || 'mangadex').toLowerCase();
    const provider = this.providers.get(key);
    if (!provider) {
      // Default to mangadex if requested provider is unknown
      return this.providers.get('mangadex')!;
    }
    return provider;
  }

  list(): { name: string; isDefault: boolean }[] {
    return [
      { name: 'mangadex', isDefault: true },
      { name: 'manganato', isDefault: false },
      { name: 'mangaread', isDefault: false },
    ];
  }
}

export const registry = new ProviderRegistry();
export { MangaDexProvider, ManganatoProvider };
