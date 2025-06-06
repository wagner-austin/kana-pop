/**
 * Centralised window-/dpi-resize publisher.
 * Other modules subscribe instead of touching `window` directly.
 */
import resizeCanvas from './ResizeCanvas';

// Re-export for testing or specific advanced usage if needed.
export { resizeCanvas };

export type ResizeCallback = () => void;

class ResizeService {
  private listeners = new Set<ResizeCallback>();
  private watchedCanvases = new Map<HTMLCanvasElement, ResizeCallback>();
  private mediaQuery: MediaQueryList | null = null;
  private boundTrigger = this.trigger.bind(this);
  private dprCallback: (() => void) | null = null;
  private metrics = { w: 0, h: 0, dpr: 1 };

  /** Subscribe and immediately invoke the callback once. */
  subscribe(cb: ResizeCallback): void {
    this.listeners.add(cb);
    cb(); // run once synchronously
    if (this.listeners.size === 1) this.attachWindowListeners();
  }

  unsubscribe(cb: ResizeCallback): void {
    this.listeners.delete(cb);
    if (this.listeners.size === 0) this.detachWindowListeners();
  }

  /** Keeps a canvas pixel-perfect on every resize/dpi change. */
  watchCanvas(canvas: HTMLCanvasElement): void {
    const callback = () => {
      const m = resizeCanvas(canvas);
      this.metrics = m;
    };
    this.watchedCanvases.set(canvas, callback);
    this.subscribe(callback);
  }

  /** Stops watching a canvas for resize/dpi changes. */
  unwatchCanvas(canvas: HTMLCanvasElement): void {
    const callback = this.watchedCanvases.get(canvas);
    if (callback) {
      this.unsubscribe(callback);
      this.watchedCanvases.delete(canvas);
    }
  }

  // ────────────────────────────────────────────────────────────
  private trigger(): void {
    this.listeners.forEach((cb) => cb());
  }

  private attachWindowListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.boundTrigger);
      /* we ignore visualViewport changes – page zoom shouldn't resize the canvas */
      this.addDprListener();
    }
  }

  private detachWindowListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.boundTrigger);
    }
    if (this.dprCallback) {
      this.mediaQuery?.removeEventListener('change', this.dprCallback);
    }
    this.mediaQuery = null;
    this.dprCallback = null;
  }

  /**
   * Re-creates a matchMedia listener tied to the *current*
   * device-pixel-ratio.  Called on initial attach *and* every time
   * the DPR changes so future changes are still caught.
   */
  private addDprListener(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return; // Not in a browser environment or matchMedia is not supported
    }

    // Tear down any previous query.
    if (this.dprCallback) {
      this.mediaQuery?.removeEventListener('change', this.dprCallback);
    }

    // Set up a fresh one for the current DPR.
    this.mediaQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);

    this.dprCallback = () => {
      this.boundTrigger();
      this.addDprListener(); // re-attach for the new DPR
    };

    // When it fires we ① notify subscribers and ② arm a new listener
    // for whatever DPR we just switched to.
    this.mediaQuery.addEventListener('change', this.dprCallback, { once: true });
  }

  get cssWidth() {
    return this.metrics.w;
  }
  get cssHeight() {
    return this.metrics.h;
  }
  get dpr() {
    return this.metrics.dpr;
  }
}

export default new ResizeService();
