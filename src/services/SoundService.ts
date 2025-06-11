import AudioBufferBank from './AudioBufferBank';

import Loader from '@/services/AssetLoader';
import Lang from '@/services/LanguageService';
import Logger from '@/utils/Logger';
import type { SymbolDef } from '@/types/language';
import { requiresSpecialAudioHandling } from '@/utils/DeviceInfo';
import { SFX_BASE_PATH, POP_SFX_FILES } from '@/config/constants';

const log = new Logger('Sound');

class SoundService {
  private assetLoadCompletedPromise: Promise<void>;
  private assetLoadCompletedResolve!: () => void; // Definite assignment in constructor
  private bank = new AudioBufferBank();
  private ready!: Promise<void>;
  private triggerReady!: () => void;
  private isGestureArmed = false; // prevents double-registration
  private static SILENT =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAACJWAAABAAgAZGF0YQAAAAA=';

  /* public again – we `new SoundService()` at EOF */
  constructor() {
    this.assetLoadCompletedPromise = new Promise<void>((resolve) => {
      this.assetLoadCompletedResolve = resolve;
    });

    Loader.add(async () => {
      log.info('SoundService: Waiting for LanguageService to be ready...');
      await Lang.ready(); // Wait for language data to be loaded
      log.info('SoundService: LanguageService is ready. Starting sound preload...');

      const soundUrls = Lang.symbols.map((s) => `${Lang.currentCode}/${s.audio}`);
      /* ── SFX preload (language-agnostic) ─────────────────────────── */
      const sfxUrls = POP_SFX_FILES.map((f) => `${SFX_BASE_PATH}${f}`);
      const allUrls = [...soundUrls, ...sfxUrls];

      if (allUrls.length > 0) {
        try {
          await this.preloadAll(allUrls);
          log.info(
            `SoundService: Successfully preloaded ${allUrls.length} sounds for language '${Lang.currentCode}'.`,
          );
        } catch (error) {
          log.error('SoundService: Error during sound preloading.', error);
        }
      } else {
        log.info(`SoundService: No sounds to preload for language '${Lang.currentCode}'.`);
      }
      this.assetLoadCompletedResolve(); // Sounds are now considered 'ready' (or attempted to load)
    });

    this.ready = new Promise<void>((res) => (this.triggerReady = res));

    /* Re-probe the audio pipeline whenever the page regains focus */
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          log.debug('Page became visible – poking AudioContext');
          this.bank.ensureContext().catch(() => {
            /* ignore – a user gesture will repair if needed */
          });
        }
      });
    }
  }

  public async armFirstGesture(el: EventTarget = window): Promise<void> {
    // Prevent duplicate registrations
    if (this.isGestureArmed) return;
    this.isGestureArmed = true;
    log.info('First gesture handler armed');

    // For iPad Safari and iPad Chrome, we need more aggressive handling
    const isSpecialDevice = requiresSpecialAudioHandling();

    // Keep track of all registered handlers to clean up later
    const registeredEvents: { target: EventTarget; type: string }[] = [];

    // Function to register an event listener and track it
    const registerEvent = (target: EventTarget, eventType: string) => {
      target.addEventListener(eventType, unlockAudio, { passive: true });
      registeredEvents.push({ target, type: eventType });
    };

    /** Remove every unlock listener *except* one window-level pointerdown */
    const cleanupEvents = () => {
      log.info('Trimming audio unlock listeners (keeping one for re-unlock)');
      let kept = false;
      registeredEvents.forEach(({ target, type }) => {
        if (!kept && target === window && type === 'pointerdown') {
          kept = true; // keep exactly this one
          return;
        }
        target.removeEventListener(type, unlockAudio);
      });
    };

    // Define a single handler for the user gesture
    const unlockAudio = async () => {
      log.info('User gesture detected, unlocking audio');

      // Flag to track if we've successfully unlocked
      let unlocked = false;

      try {
        // The primary unlock method - all we need in most cases
        await this.bank.resume();
        log.info('Audio context unlocked successfully');
        unlocked = true;
      } catch (err) {
        // If the AudioBufferBank resume fails, we log once and try the HTML Audio fallback
        log.warn('AudioContext unlock failed, trying HTML Audio fallback', err);

        try {
          // Fallback to HTML Audio element if Web Audio API fails
          const audio = new Audio(SoundService.SILENT);
          audio.autoplay = true; // Set property directly
          audio.muted = false; // Don't mute - we need actual audio
          audio.volume = 0.001; // Very low volume
          audio.setAttribute('playsinline', '');

          // Try playing the silent audio
          log.info('Playing fallback HTML audio');
          const playPromise = audio.play();

          if (playPromise instanceof Promise) {
            await playPromise;
            log.info('Fallback audio played successfully');

            // Try one more time to resume the AudioContext after playing silent audio
            try {
              await this.bank.resume();
              log.info('Audio context unlocked after HTML audio fallback');
              unlocked = true;
            } catch (resumeErr) {
              log.warn('Audio context still locked after HTML audio fallback', resumeErr);
            }
          } else {
            log.warn('Fallback audio play() returned no promise');
          }
        } catch (fallbackErr) {
          log.error('All audio unlock attempts failed', fallbackErr);
        }
      }

      /* Always let anyone awaiting ready() continue */
      this.triggerReady();

      /* If we have a fully running context trim listeners, otherwise keep them all */
      if (unlocked) cleanupEvents();
      else log.warn('Audio still locked – listeners stay armed for another try');
    };

    // Register handlers on multiple elements and events for maximum coverage
    log.info('Registering audio unlock gesture handlers');

    // Basic handlers on the provided element
    registerEvent(el, 'pointerdown');
    registerEvent(el, 'touchstart');
    registerEvent(el, 'click');

    // On iOS/iPadOS, add more handlers at the document level
    if (isSpecialDevice) {
      log.info('Adding extra handlers for iOS/iPadOS');
      registerEvent(document.body, 'pointerdown');
      registerEvent(document.body, 'touchstart');
      registerEvent(document.body, 'click');
      registerEvent(document, 'pointerdown');
      registerEvent(document, 'touchstart');
      registerEvent(document, 'click');

      // Try to include the window as well
      registerEvent(window, 'pointerdown');
      registerEvent(window, 'touchstart');
      registerEvent(window, 'click');
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
    const audio = Lang.symbols.find((s: SymbolDef) => s.roman === roman)?.audio;
    if (audio) this.play(`${Lang.currentCode}/${audio}`);
  }

  playPop(): void {
    const file =
      POP_SFX_FILES[Math.floor(Math.random() * POP_SFX_FILES.length)] ?? POP_SFX_FILES[0];
    // fire-and-forget
    this.play(`${SFX_BASE_PATH}${file}`);
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

  public assetsReady(): Promise<void> {
    return this.assetLoadCompletedPromise;
  }
}

export default new SoundService();

// Helper function for cache-busting
function withHash(url: string) {
  if (url.startsWith('data:')) return url;
  const h = import.meta.env.VITE_BUILD_HASH as string | undefined;
  return h ? `${url}?v=${h}` : url;
}
