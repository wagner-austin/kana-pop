export type GlyphMap = Record<string, string>;        // any script name ➜ glyph  
export interface SymbolDef {
  glyphs: GlyphMap;                                   // e.g. { hiragana:'あ', katakana:'ア' }
  roman:  string;                                     // Hepburn, Yale, etc., chosen per-lang
  audio:  string;                                     // file relative to /audio/<lang>/
  category: 'basic' | 'dakuten' | 'handakuten' | 'combo' | 'other';
}
export interface LanguageDef {
  code:    string;                                    // iso-639-1 or BCP-47 (“ja”, “ru”, “ar-EG”…)  
  name:    string;                                    // user-visible
  symbols: SymbolDef[];
}
