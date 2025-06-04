export interface SymbolDef {
  char: string;
  roman: string;
  audio: string;
}
export interface LanguageDef {
  code: string;
  name: string;
  symbols: SymbolDef[];
}

// Add once at top-level (outside the class)
const langModules = import.meta.glob('../data/lang/*.json', { import: 'default' });

class LanguageService {
  private lang: LanguageDef;
  constructor() {
    // Default language (lazy-loaded because vite’s `import()` is async)
    this.lang = { code: 'ja', name: '', symbols: [] };
  }

  async load(code = 'ja') {
    const key = `../data/lang/${code}.json`;
    const loader = langModules[key] as (() => Promise<LanguageDef>) | undefined;
    if (!loader) throw new Error(`Unknown language: ${code}`);
    this.lang = await loader();
  }
  get symbols() {
    return this.lang.symbols;
  }
  get currentCode() {
    return this.lang.code;
  }
}

export default new LanguageService();
