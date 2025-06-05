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
      // Add listener for both touchstart and click to better handle activation
      const activateHaptics = () => {
        if (this.lastVibration === 0) {
          // Initialize with a clear, safe vibration pattern that works on both platforms
          // We use a direct call to navigator.vibrate to avoid our own throttle
          if (this.isIOS) {
            // iOS works better with a single longer vibration
            navigator.vibrate(100);
            this.updateDebugStatus('iOS vibration activated');
          } else {
            // Android works better with properly formed even-length patterns
            // Using [0, 100] ensures the pattern starts with a pause (0ms) then vibrates
            navigator.vibrate([0, 100]);
            this.updateDebugStatus('Android vibration activated');
          }

          // Special handling of lastVibration for initialization:
          // Set it to a past time to allow immediate vibrations after this
          this.lastVibration = Date.now() - 400; // This allows another vibration immediately after
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
  /**
   * Fire a vibration with pattern support.
   * Optimized for compatibility across Android and iOS devices.
   *
   * @param pattern - Number of milliseconds to vibrate or pattern array
   * @param intensity - Intensity level (1=subtle, 2=medium, 3=strong)
   * @returns boolean indicating if vibration was attempted
   */
  vibrate(pattern: number | number[] = 50, intensity: 1 | 2 | 3 = 2): boolean {
    if (!this.enabled) return false;

    // Add throttle to prevent frequent vibrations (using 300ms for safer gap)
    const now = Date.now();
    if (now - this.lastVibration < 300) return false;

    try {
      let actual: number | number[] = pattern;

      // Keep patterns; only build them when caller gives a single number
      if (!Array.isArray(pattern)) {
        // Enforce minimum duration of 50ms for better hardware compatibility
        const p = Math.max(pattern, 50);
        const gap = HAPTIC_PULSE_GAP_MS;

        if (this.isIOS) {
          // iOS works better with a single longer vibration
          actual = intensity === 3 ? p * 2 : p * 1.5;
        } else {
          // Android works better with even-length pattern arrays
          switch (intensity) {
            case 1: // Subtle
              actual = p;
              break;
            case 2: // Medium
              actual = [p, gap, p];
              break;
            case 3: // Strong
              actual = [p, gap, p, gap, p];
              break;
          }
        }
      }

      // Call the native API and check for success
      const ok = navigator.vibrate(actual);
      if (ok) {
        this.lastVibration = now;
        this.updateDebugStatus(`Vibrated: ${JSON.stringify(actual)}`);
      } else {
        this.updateDebugStatus('Vibration rejected (blocked by browser)');
      }
      return ok;
    } catch (e) {
      console.warn('Vibration failed:', e);
      this.updateDebugStatus(`Failed: ${e}`);
      return false;
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
