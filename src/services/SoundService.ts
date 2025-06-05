import Lang from '@/services/LanguageService';
import AudioBufferBank from './AudioBufferBank';

class SoundService {
  private bank = new AudioBufferBank();
  private ready!: Promise<void>;
  private triggerReady!: () => void;
  private armed = false; // prevents double-registration
  private static SILENT = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAA==';

  constructor() {
    this.ready = new Promise<void>((res) => (this.triggerReady = res));
  }

  armFirstGesture(el: EventTarget = window) {
    if (this.armed) return;
    this.armed = true;

    const handler = () => {
      const a = new Audio(SoundService.SILENT);
      a.play()
        .catch(() => {})
        .finally(() => {
          this.bank.resume(); // <— wake Web Audio while we’re in-gesture
          this.triggerReady();
        });
    };

    // One of these will fire on every modern browser
    ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach((type) =>
      el.addEventListener(type, handler, { once: true, passive: true }),
    );
  }

  async play(path: string) {
    await this.ready; // waits for the unlock

    // The path includes the language code, e.g., "ja/fallback.mp3"
    // If the specific audio file (without lang prefix) is 'fallback.mp3', skip playback.
    if (path.endsWith('fallback.mp3')) {
      // console.log('Skipping playback for fallback.mp3');
      return;
    }
    const url = withHash(`${import.meta.env.BASE_URL}audio/${path}`);
    try {
      const buff = await this.bank.fetch(url);
      this.bank.play(buff);
    } catch {
      // Silent failure is fine (e.g. audio disabled in unit tests)
    }
  }

  playRoman(roman: string) {
    const audio = Lang.symbols.find((s) => s.roman === roman)?.audio;
    if (audio) this.play(`${Lang.currentCode}/${audio}`);
  }

  async preloadAll(paths: string[]) {
    await this.ready; // Wait for audio context to be unmuted by user gesture.
    await Promise.all(
      paths.map((p) => {
        // The path 'p' already includes the language code, e.g., "ja/sfx_pop.mp3"
        // If the path ends with 'fallback.mp3', skip preloading.
        if (p.endsWith('fallback.mp3')) {
          // console.log(`Skipping preload for ${p} as it's a fallback sound.`);
          return Promise.resolve(); // Don't attempt to preload fallback
        }
        const url = withHash(`${import.meta.env.BASE_URL}audio/${p}`);
        return this.bank.fetch(url).catch(() => {
          /* swallow – other preloads continue */
        });
      }),
    );
  }
}

export default new SoundService();

// Helper function for cache-busting
function withHash(url: string) {
  if (url.startsWith('data:')) return url;
  const h = import.meta.env.VITE_BUILD_HASH as string | undefined;
  return h ? `${url}?v=${h}` : url;
}
