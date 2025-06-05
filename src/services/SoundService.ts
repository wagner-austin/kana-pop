import Lang from '@/services/LanguageService';

class SoundService {
  private cache = new Map<string, HTMLAudioElement>();
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
    el.addEventListener(
      'pointerdown',
      () => {
        const a = new Audio(SoundService.SILENT);
        const playPromise = a.play();

        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .catch(() => {
              /* ignored — still counts as gesture */
            })
            .finally(() => this.triggerReady());
        } else {
          // If play() doesn't return a promise (e.g., JSDOM) or fails to return one,
          // we still consider the gesture made and trigger readiness.
          this.triggerReady();
        }
      },
      { once: true, passive: true },
    );
  }

  async play(path: string) {
    await this.ready;

    // The path includes the language code, e.g., "ja/fallback.mp3"
    // If the specific audio file (without lang prefix) is 'fallback.mp3', skip playback.
    if (path.endsWith('fallback.mp3')) {
      // console.log('Skipping playback for fallback.mp3');
      return;
    }
    const url = withHash(`/audio/${path}`); // Assuming audio files are in /public/audio/
    let el = this.cache.get(url);
    if (!el) {
      el = new Audio(url);
      this.cache.set(url, el);
    }

    el.currentTime = 0;
    el.play().catch((_error) => {
      // Ignore errors, especially those related to user gesture requirements for autoplay.
      // console.warn(`Audio playback failed for ${url}:`, error);
    });
  }

  playRoman(roman: string) {
    const audio = Lang.symbols.find((s) => s.roman === roman)?.audio;
    if (audio) this.play(`${Lang.currentCode}/${audio}`);
  }

  async preloadAll(paths: string[]) {
    await Promise.all(
      paths.map(
        (p) =>
          new Promise<void>((resolvePathPromise) => {
            const url = withHash(`/audio/${p}`);
            const el = new Audio(url);

            // Mute the element before defining/running the warm function.
            el.muted = true;

            const warm = () => {
              const playPromise = el.play(); // Attempt to play to kick off decode.

              if (playPromise && typeof playPromise.then === 'function') {
                return playPromise
                  .then(() => {
                    el.pause();
                    el.currentTime = 0; // Rewind for actual use.
                  })
                  .catch(() => {
                    // Errors during warming play are ignored for the purpose of warming.
                    // The decode attempt was made.
                  })
                  .finally(() => {
                    el.muted = false; // Always restore muted state.
                  });
              } else {
                // JSDOM or other environments where play() doesn't return a Promise.
                // The attempt to play (and thus decode) was made.
                el.muted = false; // Restore muted state.
                return Promise.resolve(); // Fulfill promise chain.
              }
            };

            // Chain the warming process to occur after the initial gesture readiness.
            // The outer promise for this path (resolvePathPromise) resolves once warming is done.
            this.ready.then(warm).finally(() => {
              resolvePathPromise();
            });

            this.cache.set(url, el); // Cache the element.
          }),
      ),
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
