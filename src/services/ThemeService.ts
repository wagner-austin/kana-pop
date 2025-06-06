import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';
import { ImageEffect } from '@/effects/ImageEffect';
import { VideoEffect } from '@/effects/VideoEffect';
import { ShaderEffect } from '@/effects/ShaderEffect';
import { CssEffect } from '@/effects/CssEffect';
import { setThemePalette } from '@/config/constants';

// Use import.meta.glob to make Vite aware of all possible theme assets
// Eagerly load them and get their default export (the URL string due to '?url')
const THEME_ASSET_URLS = import.meta.glob('../assets/themes/*/*.*', {
  query: '?url',
  eager: true,
  import: 'default',
}) as Record<string, string>;

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
  | { type: 'image'; horizontal: string; vertical: string }
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
    // Normalize theme folder (strip src/assets/themes and trailing slash)
    const themeFolder = manifestDir.replace(/^assets\/themes\//, '').replace(/\/$/, '');
    // Helper to resolve any asset URL using the pre-globbed THEME_ASSET_URLS map
    function viteAssetUrl(file: string): string {
      // No longer async
      const pathKey = `../assets/themes/${themeFolder}/${file}`;
      const url = THEME_ASSET_URLS[pathKey];

      if (url === undefined) {
        console.error(`[ThemeService] Asset URL not found for key: ${pathKey}`);
        console.error(
          '[ThemeService] Attempted to load file:',
          file,
          'from theme folder:',
          themeFolder,
        );
        console.error('[ThemeService] Available keys from glob:', Object.keys(THEME_ASSET_URLS));
        throw new Error(
          `Asset URL not found by viteAssetUrl: ${pathKey}. Check theme.json and asset paths.`,
        );
      }
      return url;
    }

    if (cfg.type === 'image') {
      if (import.meta.env.VITEST) {
        console.warn(`[ThemeService] VITEST env: Using NoopEffect for image backgrounds`);
        return new NoopEffect();
      }
      const horizontalUrl = viteAssetUrl(cfg.horizontal);
      const verticalUrl = viteAssetUrl(cfg.vertical);
      return new ImageEffect({ horizontal: horizontalUrl, vertical: verticalUrl });
    } else if (cfg.type === 'video') {
      if (import.meta.env.VITEST) {
        console.warn(`[ThemeService] VITEST env: Using NoopEffect for video ${cfg.file}`);
        return new NoopEffect();
      }
      const videoUrl = viteAssetUrl(cfg.file);
      return new VideoEffect(videoUrl);
    } else if (cfg.type === 'script') {
      try {
        // (This assumes your scripts are already ESM, otherwise adapt as needed)
        const scriptPath = `/src/assets/themes/${themeFolder}/${cfg.file}`;
        const mod = await import(/* @vite-ignore */ scriptPath);
        const Ctor = mod[cfg.export];
        if (typeof Ctor === 'function') {
          return new Ctor(manifestDir);
        } else {
          throw new Error(`Export "${cfg.export}" from script "${cfg.file}" is not a constructor.`);
        }
      } catch (error) {
        console.error(`Failed to load script effect "${cfg.file}":`, error);
        throw error;
      }
    } else if (cfg.type === 'shader') {
      return new ShaderEffect(cfg.shader);
    } else if (cfg.type === 'css') {
      return new CssEffect(cfg.class);
    } else {
      const _exhaustiveCheck: never = cfg;
      throw new Error(`ThemeService: unknown effect type: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

export default new ThemeService();
