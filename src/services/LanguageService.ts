import { LanguageDef, SymbolDef } from '@/types/language';
// Import the manifest directly. This provides metadata for all available languages.
import languageManifestFile from '../data/lang/index.json' assert { type: 'json' };
import StorageService from '@/utils/StorageService';
import Logger from '@/utils/Logger';

const log = new Logger('Lang');

// Define a type for the entries within 'index.json' to ensure type safety.
interface LanguageManifestEntry {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}
// Cast the imported JSON data to our defined type.
const languageManifest = languageManifestFile as LanguageManifestEntry[];

// Vite's import.meta.glob is used to get loader functions for individual language data files (e.g., ja.json).
// These loaders are invoked dynamically when a specific language's data is needed.
const langDataFileLoaders = import.meta.glob('../data/lang/*.json', { import: 'default' });
// Note: Keys in langDataFileLoaders are relative paths, e.g., '../data/lang/ja.json'.
// This glob will also pick up '../data/lang/index.json', but the load logic specifically targets [code].json.

class LanguageService {
  private lang: LanguageDef; // This will be fully initialized by load() or constructor.
  public readonly defaultCode: string;

  constructor() {
    const savedLang = StorageService.get('kanaPop.lang');
    const browserLang = navigator.language?.slice(0, 2); // Get primary language subtag (e.g., 'en' from 'en-US')
    this.defaultCode = savedLang || browserLang || 'ja'; // Determine default language code.

    // Initialize `this.lang` with a valid basic structure.
    // This ensures `this.lang` is always a valid `LanguageDef` object.
    // `load()` will later populate it with the full symbol data.
    let initialManifestEntry = languageManifest.find((l) => l.code === this.defaultCode);

    if (!initialManifestEntry) {
      log.warn(
        `Default code '${this.defaultCode}' not in manifest. Falling back to first manifest entry or 'ja'.`,
      );
      initialManifestEntry = languageManifest.find((l) => l.code === 'ja') || languageManifest[0];
    }

    if (!initialManifestEntry) {
      // This is a critical state: the manifest is likely empty or missing 'ja' and other fallbacks.
      log.error(
        'CRITICAL - Language manifest is empty or essential fallbacks are missing. App functionality will be severely impaired.',
      );
      // Provide a minimal, non-null fallback to prevent immediate crashes.
      this.lang = {
        code: this.defaultCode, // Use the determined default code
        name: 'Error: Language Undefined',
        symbols: [],
        direction: 'ltr', // Default direction
      };
    } else {
      this.lang = {
        code: initialManifestEntry.code,
        name: initialManifestEntry.name,
        symbols: [], // Symbols will be populated by the `load()` method.
        direction: initialManifestEntry.direction,
      };
    }
  }

  async load(code: string = this.defaultCode): Promise<void> {
    const manifestEntry = languageManifest.find((l) => l.code === code);

    if (!manifestEntry) {
      log.error(`Language code '${code}' not found in manifest. Attempting to fall back.`);
      // If the requested code is invalid, try falling back to defaultCode if it's different.
      if (code !== this.defaultCode) {
        const fallbackEntry = languageManifest.find((l) => l.code === this.defaultCode);
        if (fallbackEntry) {
          log.warn(`Falling back to default language '${this.defaultCode}'.`);
          return this.load(this.defaultCode); // Recursive call with defaultCode.
        }
      }
      // If fallback also fails or wasn't applicable.
      throw new Error(
        `LanguageService: Language code '${code}' (and default '${this.defaultCode}') not found in manifest.`,
      );
    }

    if (code === 'index') {
      throw new Error('LanguageService: index.json is the manifest, not a language data file.');
    }

    const langFilePath = `../data/lang/${code}.json`;
    // Retrieve the dynamic importer function for the specific language file.
    const loader = langDataFileLoaders[langFilePath] as (() => Promise<LanguageDef>) | undefined;

    if (!loader) {
      log.error(
        `No data file loader found for code '${code}' (path: '${langFilePath}'). Check glob pattern and file existence.`,
      );
      throw new Error(`LanguageService: No data file loader for '${code}'.`);
    }

    let loadedLangFileContent: LanguageDef;
    try {
      // Execute the loader to get the language file content.
      // Assumes language files (e.g., ja.json) do not yet contain 'direction'.
      loadedLangFileContent = await loader();
    } catch (error) {
      log.error(
        `Failed to load language data file for code '${code}' from '${langFilePath}'.`,
        error,
      );
      throw new Error(`LanguageService: Failed to load data for '${code}'.`);
    }

    // Construct the complete LanguageDef object.
    // The manifest provides the authoritative 'name' and 'direction'.
    // The language file provides 'symbols' and its own 'code'.
    this.lang = {
      symbols: loadedLangFileContent.symbols || [],
      code: manifestEntry.code || loadedLangFileContent.code, // Prioritize manifest, then file
      name: manifestEntry.name, // Name from the central manifest.
      direction: manifestEntry.direction, // Direction from the central manifest.
    };

    // Sanity check: the code within the loaded file should match the requested (and manifest-validated) code.
    if (loadedLangFileContent.code && loadedLangFileContent.code !== manifestEntry.code) {
      log.warn(
        `Mismatch! Requested/Manifest code '${manifestEntry.code}', but file contains code '${loadedLangFileContent.code}'. Prioritizing manifest code.`,
      );
      this.lang.code = manifestEntry.code; // Ensure consistency.
    }

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
