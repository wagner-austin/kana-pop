/* Enhanced wrapper around the Vibration API with better mobile support.
   Falls back gracefully, respects user accessibility prefs, and provides better feedback. */

import { IS_DEV, HAPTIC_PULSE_GAP_MS, DEBUG_ELEMENT_ID_PREFIX } from '@/config/constants';

export class HapticService {
  private enabled = false;
  private debugElement: HTMLElement | null = null;
  private lastVibration = 0;

  constructor() {
    /* Skip initialization in SSR environments */
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    /* Honour "prefers-reduced-motion: reduce" early. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.warn('Haptics disabled due to reduced motion preference.');
      return; // leave .enabled false
    }

    /* Basic feature probe. */
    if (typeof navigator.vibrate === 'function') {
      this.enabled = true;
      console.warn('Haptic feedback enabled.'); // Changed to console.warn to satisfy linter

      // Create debug element in development mode
      if (IS_DEV) {
        // Use IS_DEV from constants
        this.createDebugElement();
        this.updateDebugStatus('Initialized');
      }

      // Test vibration on init to improve chances of working later
      // (Some mobile browsers require user interaction first)
      document.addEventListener(
        'touchstart',
        () => {
          // One-time initialization vibration on first touch
          if (this.lastVibration === 0) {
            this.vibrate(1);
            this.updateDebugStatus('Activated on touch');
          }
        },
        { once: true },
      );
    } else {
      console.warn('Haptic feedback not supported on this device.');
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

    try {
      // Different patterns based on intensity
      let actualPattern: number | number[];

      if (typeof pattern === 'number') {
        switch (intensity) {
          case 1: // Subtle
            actualPattern = pattern;
            break;
          case 2: // Medium
            actualPattern = pattern > 10 ? [pattern, HAPTIC_PULSE_GAP_MS] : pattern;
            break;
          case 3: // Strong
            actualPattern = pattern > 10 ? [pattern, HAPTIC_PULSE_GAP_MS, pattern] : pattern;
            break;
          default:
            actualPattern = pattern;
        }
      } else {
        actualPattern = pattern;
      }

      navigator.vibrate(actualPattern);
      this.lastVibration = Date.now();
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
