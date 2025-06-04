/**
 * Centralised window-/dpi-resize publisher.
 * Other modules subscribe instead of touching `window` directly.
 */
import resizeCanvas from '../utils/resizeCanvas'; // Changed from .js

export type ResizeCallback = () => void;

class ResizeService {
  private listeners = new Set<ResizeCallback>();
  private watchedCanvases = new Map<HTMLCanvasElement, ResizeCallback>();
  private mediaQuery: MediaQueryList | null = null;
  private boundTrigger = this.trigger.bind(this);

  /** Subscribe and immediately invoke the callback once. */
  subscribe(cb: ResizeCallback): void {
    this.listeners.add(cb);
    cb();                                   // run once synchronously
    if (this.listeners.size === 1) this.attachWindowListeners();
  }

  unsubscribe(cb: ResizeCallback): void {
    this.listeners.delete(cb);
    if (this.listeners.size === 0) this.detachWindowListeners();
  }

  /** Keeps a canvas pixel-perfect on every resize/dpi change. */
  watchCanvas(canvas: HTMLCanvasElement): void {
    const callback = () => resizeCanvas(canvas);
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
    this.listeners.forEach(cb => cb());
  }

  private attachWindowListeners(): void {
    window.addEventListener('resize', this.boundTrigger);
    this.addDprListener();
  }

  private detachWindowListeners(): void {
    window.removeEventListener('resize', this.boundTrigger);
    // The DPR listener (this.mediaQuery) uses { once: true } and an anonymous function,
    // so it removes itself. No need to explicitly remove it here.
    this.mediaQuery = null;
  }


  /**
   * Re-creates a matchMedia listener tied to the *current*
   * device-pixel-ratio.  Called on initial attach *and* every time
   * the DPR changes so future changes are still caught.
   */
  private addDprListener(): void {
    // Tear down any previous query.
    this.mediaQuery?.removeEventListener('change', this.boundTrigger);

    // Set up a fresh one for the current DPR.
    this.mediaQuery =
      matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);

    // When it fires we ① notify subscribers and ② arm a new listener
    // for whatever DPR we just switched to.
    this.mediaQuery.addEventListener(
      'change',
      () => {
        this.boundTrigger();
        this.addDprListener();   // re-attach for the new DPR
      },
      { once: true }
    );
  }
}

export default new ResizeService();
