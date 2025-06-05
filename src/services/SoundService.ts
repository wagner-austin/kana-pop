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
    console.warn('SoundService: First gesture armed.');

    // Check if this is an iOS device
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream;
    console.warn(`Device detected as ${isIOS ? 'iOS' : 'non-iOS'}`);

    const handler = () => {
      console.warn('User interaction detected, attempting to unlock audio...');

      // Play a silent sound to ensure the audio context is "unlocked".
      // This is a common workaround for browsers that require user interaction for audio.
      const a = new Audio(SoundService.SILENT);

      // For iOS, we need to set the playback rate explicitly and play inline
      if (isIOS) {
        a.setAttribute('playsinline', '');
        a.muted = true;
        a.playbackRate = 1.0;
      }

      a.play()
        .then(() => {
          console.warn('Silent audio played successfully');
        })
        .catch((err) => {
          // Log if silent audio play fails, though it's often a non-critical issue.
          console.warn('Silent audio playback for arming gesture failed:', err);
        })
        .finally(async () => {
          // 🔑 Make sure the AudioContext is resumed *inside* the gesture
          try {
            await this.bank.resume();
            console.warn('AudioContext resumed successfully in gesture handler');
            this.triggerReady();
          } catch (err) {
            console.error('Failed to resume audio context:', err);
          }
        });
    };

    // For iOS, we need additional events and multiple attempts
    if (isIOS) {
      // iOS particularly needs touchend events
      const iosEvents = ['touchend', 'touchstart', 'pointerup', 'pointerdown', 'click'];
      iosEvents.forEach((type) => {
        el.addEventListener(type, handler, { once: true, passive: true });
      });

      // Add a backup handler that runs after a delay (helps on some iOS versions)
      setTimeout(() => {
        if (!this.triggerReady) return; // Already resolved
        console.warn('Adding backup iOS audio unlock handler');
        const backupHandler = async () => {
          await this.bank.resume();
          this.triggerReady();
        };
        document.body.addEventListener('touchend', backupHandler, { once: true });
      }, 1000);
    } else {
      // For non-iOS, regular events are sufficient
      ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach((type) =>
        el.addEventListener(type, handler, { once: true, passive: true }),
      );
    }
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
