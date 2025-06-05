/* Simple, centralised wrapper around the Vibration API.
   Falls back gracefully and respects user accessibility prefs. */

export class HapticService {
  private enabled = false;

  constructor() {
    /* Honour “prefers-reduced-motion: reduce” early. */
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return; // leave .enabled false
    }

    /* Basic feature probe. */
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      this.enabled = true;
    }
  }

  /** Fire a vibration in milliseconds; ignored when unsupported/disabled. */
  vibrate(duration = 15): void {
    if (!this.enabled) return;
    /* ignore failure – some browsers deny without throwing */
    navigator.vibrate?.(duration);
  }
}

export default new HapticService();
