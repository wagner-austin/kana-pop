// ── src/repositories/LanguageRepository.ts ──────────────────────────
import type { LanguageDef } from '@/types/language';

/** Pure, stateless accessor for language JSON on disk. */
export default class LanguageRepository {
  /** Central manifest with code, name, direction. Loaded once, cached in memory. */
  private static manifestPromise: Promise<
    Array<{ code: string; name: string; direction: 'ltr' | 'rtl' }>
  > | null = null;

  // language data files
  private static readonly langFiles = import.meta.glob<LanguageDef>('../data/lang/!(*index).json', {
    import: 'default',
  });

  // index.json
  private static readonly loadManifest = import.meta.glob<
    Array<{ code: string; name: string; direction: 'ltr' | 'rtl' }>
  >('../data/lang/index.json', { import: 'default' })['../data/lang/index.json'] as () => Promise<
    Array<{ code: string; name: string; direction: 'ltr' | 'rtl' }>
  >;

  /** Fetch, parse and cache `index.json`.  */
  static async manifest() {
    if (!this.manifestPromise) {
      if (!LanguageRepository.loadManifest) {
        // This should ideally not happen if index.json exists and glob is correct,
        // as Vite statically analyzes these.
        throw new Error('Manifest loader not found. Check glob pattern and file existence.');
      }
      this.manifestPromise = LanguageRepository.loadManifest();
    }
    return this.manifestPromise;
  }

  /** Return symbols for a specific language code (throws if not found).  */
  static async language(code: string): Promise<LanguageDef> {
    const path = `../data/lang/${code}.json`;
    const loader = LanguageRepository.langFiles[path];
    if (!loader) throw new Error(`No language data file for '${code}'`);
    return loader();
  }
}
