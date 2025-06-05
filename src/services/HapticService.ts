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
  /** null = unknown; true = navigator.vibrate() accepted an array; false = array was rejected */
  private patternArraysOkay: boolean | null = null;

  constructor() {
    /* Skip initialization in SSR environments */
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Detect iOS / iPadOS – spec: Vibration API is unsupported
    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (this.isIOS) {
      log.info('iOS detected – Vibration API unsupported; Haptics disabled.');
      return; // Leave .enabled = false
    }

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
            // Android Chrome requires a direct vibration without starting with 0ms
            // Try direct pattern first, then fall back to simpler approach if needed
            try {
              navigator.vibrate(100);
              this.updateDebugStatus('Android vibration activated (simple)');
            } catch {
              // Fall back to alternative pattern if direct vibration fails
              try {
                navigator.vibrate([100, 50, 100]);
                this.updateDebugStatus('Android vibration activated (pattern)');
              } catch (e2) {
                log.warn('Vibration activation failed:', e2);
                this.updateDebugStatus('Activation failed');
              }
            }
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

    /* ── 1. Probe once per page-load ──────────────────────────────── */
    if (this.patternArraysOkay === null) {
      // Use a 2-element array; engines that only support single pulses will reject it.
      this.patternArraysOkay = navigator.vibrate([1, 1]);
      // The probe itself consumes the first user-activation: bail out early.
      if (!this.patternArraysOkay) {
        this.updateDebugStatus('Array patterns rejected – collapsing to single pulses');
        return false;
      }
      // If we get here the array was accepted; continue into normal haptics.
    }

    // Less restrictive throttle for Android to ensure initial vibrations work
    // This helps when the first vibration might be blocked
    const now = Date.now();
    const minGap = 200; // Enough to feel discrete taps, platform-agnostic
    if (now - this.lastVibration < minGap) return false;

    try {
      let actual: number | number[] = pattern;

      // Convert single-number request into a pattern/intensity pulse
      if (!Array.isArray(pattern)) {
        // Enforce minimum duration of 50ms for better hardware compatibility
        const p = Math.max(pattern, 50);
        const gap = HAPTIC_PULSE_GAP_MS;

        if (this.isIOS) {
          // iOS works better with a single longer vibration
          actual = intensity === 3 ? p * 2 : p * 1.5;
        } else {
          // Android Chrome works better with simple patterns
          // Recent Chrome versions may ignore complex patterns
          switch (intensity) {
            case 1: // Subtle
              actual = p;
              break;
            case 2: // Medium
              // Use a single longer vibration for better compatibility
              actual = Math.min(p * 1.5, 150); // Cap at 150ms for better compatibility
              break;
            case 3: // Strong
              // Strong = two pulses unless arrays are disallowed
              actual = this.patternArraysOkay ? [p, gap, p] : p * 2;
              break;
          }
        }
      }

      // If the browser rejected arrays during the probe, collapse any we built
      if (!this.patternArraysOkay && Array.isArray(actual)) {
        actual = Math.max(...actual);
      }

      const ok = navigator.vibrate(actual);
      this.updateDebugStatus(
        ok ? `Vibrated: ${JSON.stringify(actual)}` : 'navigator.vibrate() returned false',
      );
      if (ok) this.lastVibration = now;
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
