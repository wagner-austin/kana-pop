import Lang from '@/services/LanguageService';
import AudioBufferBank from './AudioBufferBank';

class SoundService {
  private bank = new AudioBufferBank();
  private ready!: Promise<void>;
  private triggerReady!: () => void;
  private isGestureArmed = false; // prevents double-registration
  private static SILENT =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAACJWAAABAAgAZGF0YQAAAAA=';

  constructor() {
    this.ready = new Promise<void>((res) => (this.triggerReady = res));
  }

  public async armFirstGesture(el: EventTarget = window): Promise<void> {
    if (this.isGestureArmed) return;
    this.isGestureArmed = true;
    // console.log('SoundService: First gesture armed.'); // Kept simpler log commented out for brevity

    const handler = () => {
      // Play a silent sound to ensure the audio context is "unlocked".
      // This is a common workaround for browsers that require user interaction for audio.
      const a = new Audio(SoundService.SILENT);
      a.play()
        .catch((err) => {
          // Log if silent audio play fails, though it's often a non-critical issue.
          console.warn('Silent audio playback for arming gesture failed:', err);
        })
        .finally(async () => {
          // 🔑 Make sure the AudioContext is resumed *inside* the gesture
          await this.bank.resume();
          this.triggerReady();
        });
    };

    // Attach the handler to the first user interaction event.
    // Using 'pointerdown' as a primary, with fallbacks for broader compatibility.
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
      await this.bank.play(buff); // Ensure bank.play is awaited as it's async
    } catch (e) {
      console.warn(
        `SoundService: Web Audio playback failed for ${url}, falling back to HTMLAudioElement. Error:`,
        e,
      );
      // Web-Audio failed – fall back to a short <audio> element
      new Audio(url).play().catch((htmlAudioError) => {
        // It's possible the HTMLAudioElement also fails (e.g. network error, unsupported format for <audio>)
        console.error(
          `SoundService: HTMLAudioElement fallback also failed for ${url}:`,
          htmlAudioError,
        );
      });
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
