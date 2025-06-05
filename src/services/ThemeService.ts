import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';
import { ImageEffect } from '@/effects/ImageEffect';
import { CssEffect } from '@/effects/CssEffect';
import { VideoEffect } from '@/effects/VideoEffect';
import { ShaderEffect } from '@/effects/ShaderEffect';
import { setThemePalette } from '@/config/constants';

// Helper for test/SSR environments where assets might not be available
class NoopEffect implements IBackgroundEffect {
  mount() {}
  unmount() {}
  resize() {}
  update() {
    return false;
  }
}

export interface Theme {
  name: string;
  palette: string[];
  effect: IBackgroundEffect;
}

type EffectCfg =
  | { type: 'image'; file: string }
  | { type: 'video'; file: string }
  | { type: 'script'; file: string; export: string }
  | { type: 'shader'; shader: string }
  | { type: 'css'; class: string };

interface Manifest {
  name: string;
  assets: { palette: string };
  effect: EffectCfg;
}

/* ①  Embed every theme under src/assets/… (glob path relative to src). */
const MANIFESTS = import.meta.glob(
  '../assets/themes/**/theme.json', // Relative to src/services/, pointing to src/assets/themes/
  { query: '?json', eager: true },
) as Record<string, Manifest>;

const PALETTES = import.meta.glob(
  '../assets/themes/**/palette.json', // Relative to src/services/, pointing to src/assets/themes/
  { query: '?json', eager: true },
) as Record<string, string[]>;

function withBase(url: string) {
  const base = import.meta.env.BASE_URL; // '/kana-pop/' in prod
  return base ? base + url.replace(/^\/+/, '') : url;
}

class ThemeService {
  private current!: Theme;

  async load(base: string): Promise<Theme> {
    // base is now like 'assets/themes/pastel-pond/'
    // Construct potential keys for MANIFESTS. Keys in MANIFESTS are like '../assets/themes/pastel-pond/theme.json'
    // but Vite normalizes these to be project-root relative from `src` perspective, e.g., 'assets/themes/pastel-pond/theme.json'
    // if the glob is 'assets/themes/**/theme.json' and themes are in 'src/assets/themes'.
    // Since our glob is '../assets/themes/**/theme.json' from 'src/services/', Vite generates keys like
    // '../assets/themes/default/theme.json'.
    // The `base` path from Play.ts will be 'assets/themes/pastel-pond/'. We need to prepend '../' to match the glob key structure.
    const manifestLookupKey = `../${base.endsWith('/') ? base : base + '/'}theme.json`.replace(
      /^\.\.\/\/+/,
      '../',
    ); // Normalize to ensure one '../'

    const manifest = MANIFESTS[manifestLookupKey];

    if (!manifest) {
      throw new Error(
        `Theme manifest not embedded for base '${base}'. Tried key '${manifestLookupKey}'. ` +
          `Available MANIFESTS keys: ${Object.keys(MANIFESTS).join(', ')}`,
      );
    }

    const paletteFileName = manifest.assets.palette.startsWith('/')
      ? manifest.assets.palette.substring(1)
      : manifest.assets.palette;
    const paletteLookupKey =
      `../${base.endsWith('/') ? base : base + '/'}${paletteFileName}`.replace(/^\.\.\/\/+/, '../');
    const palette = PALETTES[paletteLookupKey] ?? ['#ffffff']; // Default palette if missing

    const effect = await this.makeEffect(manifest.effect, base); // base is themeDir
    this.current = { name: manifest.name, palette, effect };
    setThemePalette(palette); // ← one-line addition
    return this.current;
  }

  get theme(): Theme {
    return this.current;
  }

  /* ── helpers ──────────────────────────────────────────────── */
  private async makeEffect(cfg: EffectCfg, manifestDir: string): Promise<IBackgroundEffect> {
    // 1. strip the leading `assets/themes/`
    // 2. strip ONE trailing slash (if present)
    const themeFolder = manifestDir.replace(/^assets\/themes\//, '').replace(/\/$/, '');

    if (cfg.type === 'image') {
      if (import.meta.env.VITEST) {
        console.warn(`[ThemeService] VITEST env: Using NoopEffect for image ${cfg.file}`);
        return new NoopEffect();
      }
      // `new URL()` needs a path relative to the *current* file (ThemeService.ts),
      // so we build one that walks from src/services/ up to src/ and then into assets/themes/
      const relativePath = `../${manifestDir}${cfg.file}`;
      const imageUrl = new URL(relativePath, import.meta.url).href;
      return new ImageEffect(imageUrl);
    } else if (cfg.type === 'video') {
      if (import.meta.env.VITEST) {
        console.warn(`[ThemeService] VITEST env: Using NoopEffect for video ${cfg.file}`);
        return new NoopEffect();
      }
      const videoUrl = new URL(`../${manifestDir}${cfg.file}`, import.meta.url).href;
      try {
        // For videos, assume they are also in src/assets/themes and use ?url import
        return new VideoEffect(videoUrl);
      } catch (error) {
        console.warn(
          `ThemeService: Failed to import video asset "${cfg.file}" with ?url. Error:`,
          error,
        );
        const fallbackUrl = withBase(`assets/themes/${themeFolder}/${cfg.file}`);
        console.warn(`ThemeService: Falling back to unhashed path for video: "${fallbackUrl}"`);
        return new VideoEffect(fallbackUrl);
      }
    } else if (cfg.type === 'script') {
      try {
        // Scripts are imported directly. Path relative to project root / Vite's resolution.
        // Assuming scripts are located within src/assets/themes/
        const scriptPath = `/src/assets/themes/${themeFolder}/${cfg.file}`;
        const mod = await import(/* @vite-ignore */ scriptPath); // Use vite-ignore if path is truly dynamic
        const Ctor = mod[cfg.export];
        if (typeof Ctor === 'function') {
          return new Ctor(manifestDir); // manifestDir is like 'assets/themes/pastel-pond/'
        } else {
          throw new Error(`Export "${cfg.export}" from script "${cfg.file}" is not a constructor.`);
        }
      } catch (error) {
        console.error(`Failed to load script effect "${cfg.file}":`, error);
        throw error;
      }
    } else if (cfg.type === 'shader') {
      // Shaders are defined directly in theme.json, not as files
      return new ShaderEffect(cfg.shader);
    } else if (cfg.type === 'css') {
      return new CssEffect(cfg.class);
    } else {
      // This will cause a TypeScript error if any cfg.type is not handled,
      // ensuring all types in EffectCfg are covered.
      const _exhaustiveCheck: never = cfg;
      throw new Error(`ThemeService: unknown effect type: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

export default new ThemeService();
