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

    // More comprehensive device detection
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIPadOS =
      /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    console.warn(
      `Device detected: ${isIOS ? 'iOS' : isIPadOS ? 'iPadOS' : 'other'}, Browser: ${isSafari ? 'Safari' : 'other'}`,
    );

    const handler = () => {
      console.warn('User interaction detected, attempting to unlock audio...');

      // Play a silent sound to ensure the audio context is "unlocked".
      // This is a common workaround for browsers that require user interaction for audio.
      const a = new Audio(SoundService.SILENT);

      // For iOS/iPadOS, we need to set the playback rate explicitly and play inline
      if (isIOS || isIPadOS) {
        a.setAttribute('playsinline', '');
        a.setAttribute('autoplay', '');
        a.muted = true;
        a.playbackRate = 1.0;

        // Additional attributes particularly helpful for Safari
        if (isSafari) {
          a.controls = false;
          a.preload = 'auto';
        }
      }

      // Play silent audio with comprehensive error handling
      const playPromise = a.play();

      // If play() doesn't return a promise (older Safari versions),
      // we need to handle it differently
      if (playPromise instanceof Promise) {
        playPromise
          .then(() => {
            console.warn('Silent audio played successfully');
          })
          .catch((err) => {
            // Log if silent audio play fails, though it's often a non-critical issue.
            console.warn('Silent audio playback for arming gesture failed:', err);

            // For iPad Safari, try an alternative approach if the first fails
            if (isIPadOS && isSafari) {
              console.warn('iPad Safari detected, trying alternative audio unlock...');
              try {
                // Create and play a new audio element with different settings
                const backup = new Audio();
                backup.src = SoundService.SILENT;
                backup.setAttribute('playsinline', '');
                backup.muted = true;
                backup.play().catch((e) => console.warn('Alternative unlock also failed:', e));
              } catch (e) {
                console.warn('Alternative audio unlock approach failed:', e);
              }
            }
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
      } else {
        console.warn('Browser returned no promise from play() - older Safari?');
        // Assume it worked, continue with resume
        // Handle non-promise case manually
        (async () => {
          try {
            await this.bank.resume();
            console.warn('AudioContext resumed successfully in gesture handler (non-promise path)');
            this.triggerReady();
          } catch (err) {
            console.error('Failed to resume audio context (non-promise path):', err);
          }
        })();
      }
    };

    // For iOS/iPadOS, we need additional events and multiple attempts
    if (isIOS || isIPadOS) {
      // iOS/iPadOS need comprehensive event coverage
      const mobileEvents = ['touchend', 'touchstart', 'pointerup', 'pointerdown', 'click'];

      // Add all events with individual handlers for better reliability
      mobileEvents.forEach((type) => {
        el.addEventListener(type, handler, { once: true, passive: true });
      });

      // Special handling for iPad Safari
      if (isIPadOS && isSafari) {
        console.warn('iPadOS Safari detected, applying special handling');
        // Add extra events specific to iPad Safari
        ['mousedown', 'keydown'].forEach((type) => {
          el.addEventListener(type, handler, { once: true, passive: true });
        });

        // Also add handlers to document and body for iPad Safari
        document.addEventListener('touchend', handler, { once: true, passive: true });
        document.body.addEventListener('touchstart', handler, { once: true, passive: true });
      }

      // Add multiple backup handlers with different delays
      const delays = isIPadOS && isSafari ? [500, 1000, 2000] : [1000];
      delays.forEach((delay) => {
        setTimeout(() => {
          if (!this.triggerReady) return; // Already resolved
          console.warn(`Adding backup audio unlock handler (delay: ${delay}ms)`);
          const backupHandler = async () => {
            try {
              await this.bank.resume();
              this.triggerReady();
            } catch (err) {
              console.error('Backup handler failed:', err);
            }
          };
          document.body.addEventListener('touchend', backupHandler, { once: true });
          if (isIPadOS && isSafari) {
            document.addEventListener('click', backupHandler, { once: true });
          }
        }, delay);
      });
    } else {
      // For non-iOS/iPadOS, regular events are sufficient
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
