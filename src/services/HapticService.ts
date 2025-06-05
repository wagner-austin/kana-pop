/* Enhanced wrapper around the Vibration API with better mobile support.
   Falls back gracefully, respects user accessibility prefs, and provides better feedback. */

import { IS_DEV, HAPTIC_PULSE_GAP_MS, DEBUG_ELEMENT_ID_PREFIX } from '@/config/constants';
import Logger from '@/utils/Logger';

const log = new Logger('Haptics');

export class HapticService {
  private enabled = false;
  private debugElement: HTMLElement | null = null;
  private lastVibration = 0;
  private isIOS = false;

  constructor() {
    /* Skip initialization in SSR environments */
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Detect iOS devices
    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    /* Honour "prefers-reduced-motion: reduce" early. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      log.info('Haptics disabled due to reduced-motion preference.');
      return; // leave .enabled false
    }

    /* Basic feature probe. */
    if (typeof navigator.vibrate === 'function') {
      this.enabled = true;
      log.info('Haptic feedback enabled.');

      // Create debug element in development mode
      if (IS_DEV) {
        // Use IS_DEV from constants
        this.createDebugElement();
        this.updateDebugStatus('Initialized');
      }

      // Test vibration on init to improve chances of working later
      // (Some mobile browsers require user interaction first)
      // Add listener for both touchstart and click to better handle Android activation
      const activateHaptics = () => {
        if (this.lastVibration === 0) {
          // iOS requires simpler patterns, Android benefits from patterns
          if (this.isIOS) {
            // iOS typically ignores patterns and only uses the first number
            // Using a longer single vibration works better
            navigator.vibrate(100);
            this.updateDebugStatus('iOS vibration activated');
          } else {
            // Stronger initial vibration sequence for Android
            navigator.vibrate([10, 30, 50]);
            this.updateDebugStatus('Android vibration activated');
          }
          this.lastVibration = Date.now();
        }
      };

      document.addEventListener('touchstart', activateHaptics, { once: true });
      document.addEventListener('click', activateHaptics, { once: true });
    } else {
      log.info('Haptic feedback not supported on this device.');
      if (IS_DEV) {
        // Use IS_DEV from constants
        this.createDebugElement();
        this.updateDebugStatus('Not supported');
      }
    }
  }

  /**
   * Fire a vibration with pattern support.
   * @param pattern - Number of milliseconds to vibrate or pattern array
   * @param intensity - Intensity level (1=subtle, 2=medium, 3=strong)
   */
  vibrate(pattern: number | number[] = 15, intensity: 1 | 2 | 3 = 2): void {
    if (!this.enabled) return;

    // Add throttle to prevent frequent vibrations
    const now = Date.now();
    if (now - this.lastVibration < 200) return; // iOS system window

    try {
      // Different patterns based on intensity
      let actualPattern: number | number[];

      if (typeof pattern === 'number') {
        switch (intensity) {
          case 1: // Subtle
            actualPattern = pattern;
            break;
          case 2: // Medium
            // For medium intensity (iOS vs Android optimization)
            if (this.isIOS) {
              // iOS works better with a single longer vibration
              actualPattern = pattern * 1.5; // Slightly longer
            } else {
              // Android works well with patterns
              actualPattern =
                pattern > 10 ? [pattern, HAPTIC_PULSE_GAP_MS, pattern] : [pattern, pattern];
            }
            break;
          case 3: // Strong
            // For strong intensity (iOS vs Android optimization)
            if (this.isIOS) {
              // iOS works better with a single longer vibration than patterns
              actualPattern = pattern * 2; // Double duration for strong
            } else {
              // Android works well with complex patterns
              actualPattern =
                pattern > 10
                  ? [pattern, HAPTIC_PULSE_GAP_MS, pattern, HAPTIC_PULSE_GAP_MS, pattern]
                  : [pattern, HAPTIC_PULSE_GAP_MS, pattern];
            }
            break;
          default:
            actualPattern = pattern;
        }
      } else {
        actualPattern = pattern;
      }

      navigator.vibrate(actualPattern);
      this.lastVibration = now;
      this.updateDebugStatus(`Vibrated: ${JSON.stringify(actualPattern)}`);
    } catch (e) {
      console.warn('Vibration failed:', e);
      this.updateDebugStatus(`Failed: ${e}`);
    }
  }

  /** Check if haptic feedback is supported and enabled */
  isSupported(): boolean {
    return this.enabled;
  }

  private createDebugElement() {
    if (typeof document === 'undefined') return;

    const elementId = `${DEBUG_ELEMENT_ID_PREFIX}Haptics`;
    document.getElementById(elementId)?.remove(); // HMR cleanup

    this.debugElement = document.createElement('div');
    this.debugElement.id = elementId; // Set ID for HMR cleanup
    this.debugElement.style.position = 'fixed';
    this.debugElement.style.bottom = '30px';
    this.debugElement.style.left = '10px';
    this.debugElement.style.background = 'rgba(0,0,0,0.5)';
    this.debugElement.style.color = 'white';
    this.debugElement.style.padding = '5px';
    this.debugElement.style.fontSize = '12px';
    this.debugElement.style.zIndex = '9999';
    this.debugElement.style.pointerEvents = 'none';
    document.body.appendChild(this.debugElement);
  }

  private updateDebugStatus(message: string) {
    if (this.debugElement) {
      this.debugElement.textContent = `Haptics: ${message}`;
    }
  }
}

export default new HapticService();
