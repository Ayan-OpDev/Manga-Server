import { MangaDexProvider } from './mangadex.js';
import { ManganatoProvider } from './manganato.js';
class ProviderRegistry {
    providers = new Map();
    constructor() {
        const mangadex = new MangaDexProvider();
        const manganato = new ManganatoProvider();
        this.register(mangadex);
        this.register(manganato);
        // Aliases
        this.providers.set('mangaread', manganato);
    }
    register(provider) {
        this.providers.set(provider.name.toLowerCase(), provider);
    }
    get(name) {
        const key = (name || 'mangadex').toLowerCase();
        const provider = this.providers.get(key);
        if (!provider) {
            // Default to mangadex if requested provider is unknown
            return this.providers.get('mangadex');
        }
        return provider;
    }
    list() {
        return [
            { name: 'mangadex', isDefault: true },
            { name: 'manganato', isDefault: false },
            { name: 'mangaread', isDefault: false },
        ];
    }
}
export const registry = new ProviderRegistry();
export { MangaDexProvider, ManganatoProvider };
