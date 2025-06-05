import Lang from '@/services/LanguageService';
import AudioBufferBank from './AudioBufferBank';
import Logger from '@/utils/Logger';
import { requiresSpecialAudioHandling } from '@/utils/DeviceInfo';

const log = new Logger('Sound');

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
    // Prevent duplicate registrations
    if (this.isGestureArmed) return;
    this.isGestureArmed = true;
    log.info('First gesture handler armed');

    // Define a single handler for the user gesture
    const unlockAudio = async () => {
      log.info('User gesture detected, unlocking audio');

      try {
        // The primary unlock method - all we need in most cases
        await this.bank.resume();
        log.info('Audio context unlocked successfully');
        this.triggerReady();

        // Remove the gesture handler to prevent race conditions
        ['pointerdown', 'touchstart'].forEach((eventType) => {
          el.removeEventListener(eventType, unlockAudio);
          document.removeEventListener(eventType, unlockAudio);
        });
      } catch (err) {
        // If the AudioBufferBank resume fails, we log once and try the HTML Audio fallback
        log.warn('AudioContext unlock failed, trying HTML Audio fallback', err);

        try {
          // Fallback to HTML Audio element if Web Audio API fails
          const audio = new Audio(SoundService.SILENT);
          audio.muted = true;
          audio.setAttribute('playsinline', '');
          audio.setAttribute('autoplay', '');

          const playPromise = audio.play();
          if (playPromise instanceof Promise) {
            await playPromise;
            log.info('Fallback audio played successfully');
          } else {
            log.warn('Fallback audio play() returned no promise');
          }

          // Try one more time to resume the AudioContext after playing silent audio
          await this.bank.resume();
          this.triggerReady();
        } catch (fallbackErr) {
          log.error('All audio unlock attempts failed', fallbackErr);
          // Resolve anyway to prevent app from being stuck
          this.triggerReady();
        }
      }
    };

    // Register the handler for both pointerdown (standard) and touchstart (iOS)
    log.info('Registering audio unlock gesture handlers');
    el.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    el.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

    // iOS/iPadOS may need document-level handlers too
    if (requiresSpecialAudioHandling()) {
      document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  async play(path: string) {
    await this.ready; // waits for the unlock

    // The path includes the language code, e.g., "ja/fallback.mp3"
    // If the specific audio file (without lang prefix) is 'fallback.mp3', skip playback.
    if (path.endsWith('fallback.mp3')) {
      return;
    }

    const url = withHash(`${import.meta.env.BASE_URL}audio/${path}`);
    try {
      const buff = await this.bank.fetch(url);
      await this.bank.play(buff); // Ensure bank.play is awaited as it's async
    } catch (e) {
      log.warn(`Web Audio playback failed for ${url}, using HTMLAudioElement fallback`, e);
      // Web-Audio failed – fall back to a short <audio> element
      new Audio(url).play().catch((htmlAudioError) => {
        // It's possible the HTMLAudioElement also fails (e.g. network error, unsupported format)
        log.error(`HTMLAudioElement fallback also failed for ${url}`, htmlAudioError);
      });
    }
  }

  playRoman(roman: string) {
    const audio = Lang.symbols.find((s) => s.roman === roman)?.audio;
    if (audio) this.play(`${Lang.currentCode}/${audio}`);
  }

  async preloadAll(paths: string[]) {
    await this.ready; // Wait for audio context to be unmuted by user gesture.

    log.info(`Preloading ${paths.length} audio files`);

    await Promise.all(
      paths.map((p) => {
        // Skip preloading fallback sounds
        if (p.endsWith('fallback.mp3')) {
          return Promise.resolve();
        }

        const url = withHash(`${import.meta.env.BASE_URL}audio/${p}`);
        return this.bank.fetch(url).catch((err) => {
          log.warn(`Failed to preload audio: ${p}`, err);
          // Swallow the error so other preloads continue
        });
      }),
    );

    log.info('Audio preloading complete');
  }
}

export default new SoundService();

// Helper function for cache-busting
function withHash(url: string) {
  if (url.startsWith('data:')) return url;
  const h = import.meta.env.VITE_BUILD_HASH as string | undefined;
  return h ? `${url}?v=${h}` : url;
}
