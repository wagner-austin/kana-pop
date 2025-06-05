import type { LanguageDef, SymbolDef } from '@/types/language';
import StorageService from '@/utils/StorageService';
import Logger from '@/utils/Logger';
import LanguageRepository from '@/repositories/LanguageRepository';

const log = new Logger('Lang');

class LanguageService {
  private lang: LanguageDef;
  readonly defaultCode: string;

  constructor() {
    const savedLang = StorageService.get('kanaPop.lang');
    const browserLang =
      typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : undefined;
    this.defaultCode = savedLang || browserLang || 'ja'; // Determine default language code.

    // Initialise with sane stub – real symbols arrive after first `load`.
    this.lang = { code: this.defaultCode, name: 'loading…', symbols: [], direction: 'ltr' };
  }

  async load(code: string = this.defaultCode): Promise<void> {
    const manifest = await LanguageRepository.manifest();
    const manifestEntry =
      manifest.find((m) => m.code === code) ?? manifest.find((m) => m.code === this.defaultCode);
    if (!manifestEntry) throw new Error('LanguageService: manifest empty');

    const loaded = await LanguageRepository.language(manifestEntry.code);

    if (!manifestEntry.direction) {
      log.warn(`'${manifestEntry.code}' lacks "direction"; defaulting to 'ltr'`);
    }
    const direction = manifestEntry.direction ?? 'ltr';

    this.lang = {
      code: manifestEntry.code,
      name: manifestEntry.name,
      symbols: loaded.symbols ?? [],
      direction: direction,
    };

    // Cache the successfully loaded (and validated) language code.
    this.persistLang(this.lang.code);
  }

  get symbols(): SymbolDef[] {
    return this.lang.symbols;
  }

  get currentCode(): string {
    return this.lang.code;
  }

  get direction(): 'ltr' | 'rtl' {
    return this.lang.direction;
  }

  randomGlyph(sym: SymbolDef): string {
    const variants = Object.values(sym.glyphs);
    if (variants.length === 0) {
      log.warn(
        `Symbol with roman='${sym.roman}' (category: ${sym.category}, lang: ${this.lang.code}) has no glyphs defined. Returning '?' as fallback.`,
      );
      return '?';
    }
    return variants[Math.floor(Math.random() * variants.length)]!;
  }

  /**
   * Persists the current language code to storage
   * @param code The language code to persist
   */
  private persistLang(code: string): void {
    StorageService.set('kanaPop.lang', code);
  }
}

export default new LanguageService();
