import type { LanguageDef, SymbolDef } from '@/types/language';
import Loader from '@/services/AssetLoader';
import StorageService from '@/utils/StorageService';
import Logger from '@/utils/Logger';
import LanguageRepository from '@/repositories/LanguageRepository';

const log = new Logger('Lang');

class LanguageService {
  private lang: LanguageDef;
  readonly defaultCode: string;
  private initialLoadPromise: Promise<void>;
  private initialLoadResolve!: () => void; // Definite assignment in constructor

  /* ctor must be public if we instantiate below */
  constructor() {
    const savedLang = StorageService.get('kanaPop.lang');
    const browserLang =
      typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : undefined;
    this.defaultCode = savedLang || browserLang || 'ja'; // Determine default language code.

    // Initialise with sane stub – real symbols arrive after first `load`.
    this.lang = { code: this.defaultCode, name: 'loading…', symbols: [], direction: 'ltr' };

    this.initialLoadPromise = new Promise<void>((resolve) => {
      this.initialLoadResolve = resolve;
    });

    Loader.add(async () => {
      log.info(`LanguageService: Starting initial load for language code '${this.defaultCode}'...`);
      await this.load(this.defaultCode);
      log.info('LanguageService: Initial load completed.');
    });
  }

  async load(code: string = this.defaultCode): Promise<void> {
    const manifest = await LanguageRepository.manifest();
    // Attempt to locate the desired language in the manifest, falling back sensibly if missing.
    let manifestEntry = manifest.find((m) => m.code === code);

    // If requested language is not present, fall back to the service default or the first available entry.
    if (!manifestEntry) {
      log.warn(
        `Language code '${code}' not found in manifest; falling back to '${this.defaultCode}'.`,
      );
      manifestEntry = manifest.find((m) => m.code === this.defaultCode) ?? manifest[0];
    }

    if (!manifestEntry) {
      // Still nothing?  Manifest itself must be empty – escalate.
      throw new Error('LanguageService: manifest empty');
    }

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

    // Resolve the initial load promise if it hasn't been resolved yet.
    if (this.initialLoadResolve) {
      this.initialLoadResolve();
    }
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

  public ready(): Promise<void> {
    return this.initialLoadPromise;
  }
}

export default new LanguageService();
