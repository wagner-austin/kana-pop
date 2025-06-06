/* Enhanced wrapper around the Vibration API with better mobile support.
   Falls back gracefully, respects user accessibility prefs, and provides better feedback. */

import PATTERNS, { type HapticPatternName } from './HapticPatterns';

import {
  IS_DEV,
  HAPTIC_PULSE_GAP_MS,
  DEBUG_ELEMENT_ID_PREFIX,
  HAPTICS_DEFAULT_ENABLED,
  HAPTIC_DURATION_MS, // Corrected from HAPTIC_MIN_DURATION_MS
  HAPTIC_THROTTLE_MS_SINGLE,
  HAPTIC_THROTTLE_MS_PATTERN,
} from '@/config/constants';
import StorageService from '@/utils/StorageService';
import Logger from '@/utils/Logger';

const log = new Logger('Haptics');

export class HapticService {
  private enabled = StorageService.get('kanaPop.haptics') !== 'false' && HAPTICS_DEFAULT_ENABLED;
  private debugElement: HTMLElement | null = null;
  private lastVibration = 0; // used only for normal throttle, no more “fake” initial value
  /** null = unknown; true = navigator.vibrate() accepted an array; false = array was rejected */
  private patternArraysOkay: boolean | null = null;

  constructor() {
    /* Skip initialization in SSR environments */
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
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

      /* One-shot gesture: resume AudioContext – **no vibration here** */
      const activateHaptics = () => {
        this.updateDebugStatus('Activation gesture received (resume only)');
      };

      window.addEventListener('pointerdown', activateHaptics, {
        once: true,
        passive: true,
      });
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
  async vibrate(pattern: number | number[] = 50, intensity: 1 | 2 | 3 = 2): Promise<boolean> {
    if (!this.enabled) return Promise.resolve(false);

    // Probe for array pattern support once per page-load if not already determined
    if (this.patternArraysOkay === null) {
      try {
        // Try a minimal array pattern. navigator.vibrate returns true if successful, false otherwise.
        // Some browsers might throw an error for unsupported patterns.
        if (navigator.vibrate([1, 1])) {
          // Attempt vibration
          navigator.vibrate(0); // Stop it immediately if it started
          this.patternArraysOkay = true;
          this.updateDebugStatus('Array patterns seem supported.');
        } else {
          this.patternArraysOkay = false;
          this.updateDebugStatus('Array patterns rejected (vibrate returned false).');
        }
      } catch (e) {
        this.patternArraysOkay = false;
        this.updateDebugStatus(
          `Array patterns rejected (vibrate threw error: ${e instanceof Error ? e.message : String(e)}).`,
        );
      }
      // The probe might consume the first user gesture if it's the first call.
      // We don't bail out here, subsequent logic will handle throttling.
    }

    const now = Date.now();
    const basePatternIsArray = Array.isArray(pattern);
    const minGap = basePatternIsArray ? HAPTIC_THROTTLE_MS_PATTERN : HAPTIC_THROTTLE_MS_SINGLE;

    if (now - this.lastVibration < minGap) {
      this.updateDebugStatus(`Throttled (gap: ${minGap}ms)`);
      return Promise.resolve(false);
    }

    let actualVibration: number | number[];

    if (basePatternIsArray) {
      // Pattern is an array (e.g., from a named pattern)
      actualVibration = (pattern as number[]).map((p) => Math.max(p, HAPTIC_DURATION_MS));
      if (!this.patternArraysOkay && actualVibration.length > 0) {
        // Collapse to a single pulse (max value) if arrays are not supported
        actualVibration = Math.max(...actualVibration, HAPTIC_DURATION_MS);
        this.updateDebugStatus('Collapsed array to single max pulse for compatibility.');
      }
    } else {
      // Pattern is a single number (direct duration)
      const p = Math.max(pattern as number, HAPTIC_DURATION_MS);
      const pulseGap = HAPTIC_PULSE_GAP_MS;

      switch (intensity) {
        case 1: // Subtle
          actualVibration = p;
          break;
        case 2: // Medium
          actualVibration = Math.min(p * 1.5, 150); // Cap at 150ms for better compatibility
          break;
        case 3: // Strong
          // Use a pattern for strong vibration if arrays are okay, otherwise a longer single pulse
          actualVibration = this.patternArraysOkay ? [p, pulseGap, p] : p * 2;
          break;
        default: // Should not happen due to type signature (intensity is 1 | 2 | 3)
          log.warn(`Invalid intensity: ${intensity} for numeric pattern.`);
          return Promise.resolve(false);
      }
    }

    try {
      // Ensure actualVibration is not an empty array if it somehow became one.
      if (Array.isArray(actualVibration) && actualVibration.length === 0) {
        log.warn('Attempted to vibrate with an empty pattern array.');
        return Promise.resolve(false);
      }
      // Also ensure single number vibrations are not zero if they became so.
      if (typeof actualVibration === 'number' && actualVibration === 0 && pattern !== 0) {
        // allow explicit vibrate(0) to cancel
        log.warn('Calculated vibration duration is zero, skipping.');
        return Promise.resolve(false);
      }

      const success = navigator.vibrate(actualVibration);
      if (success) {
        this.lastVibration = now;
        this.updateDebugStatus(`Vibrated: ${JSON.stringify(actualVibration)}`);
        log.info('Vibrating with:', { originalPattern: pattern, intensity, actualVibration });
        return Promise.resolve(true);
      } else {
        this.updateDebugStatus('navigator.vibrate() returned false.');
        log.warn('navigator.vibrate() returned false for pattern:', actualVibration);
        return Promise.resolve(false);
      }
    } catch (e) {
      log.warn('Vibration failed with error:', e);
      this.updateDebugStatus(`Failed: ${e instanceof Error ? e.message : String(e)}`);
      // If it failed and we thought arrays were okay, maybe they aren't (though probe should catch most).
      if (Array.isArray(actualVibration) && this.patternArraysOkay) {
        this.patternArraysOkay = false; // Re-evaluate on next attempt or mark as not okay
        this.updateDebugStatus('Error with array vibration, marked arrays as not okay for future.');
      }
      return Promise.resolve(false);
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

  /** fire a named recipe defined in HapticPatterns.ts */
  vibratePattern(name: HapticPatternName): Promise<boolean> {
    const recipe = PATTERNS[name];
    if (typeof recipe === 'number') {
      return this.vibrate(recipe);
    } else {
      return this.vibrate([...recipe]); // Create a new mutable array from readonly
    }
  }

  /** runtime toggle used by Settings UI */
  setEnabled(on: boolean) {
    this.enabled = on;
    StorageService.set('kanaPop.haptics', String(on));
    if (!on) navigator.vibrate(0); // cancel any running pattern
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export default new HapticService();
