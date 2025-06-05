// src/renderers/BackgroundRenderer.ts
import {
  backgroundColour,
  IS_DEV,
  DEBUG_MOTION_THROTTLE_MS,
  DEBUG_ELEMENT_ID_PREFIX,
} from '../config/constants';
import Logger from '../utils/Logger';

import Theme from '@/services/ThemeService'; // Corrected path alias
import {
  type MotionSample,
  type MotionProvider,
  chooseMotionProvider,
  GyroProvider,
  DummyScrollProvider,
} from '@/utils/Motion';

export default class BackgroundRenderer {
  private logger = new Logger('BackgroundRenderer');
  private motionProvider: MotionProvider;
  private activeProviderFailed = false; // Flag to indicate if primary (Gyro) failed

  /* parallax state */
  private rawOffset: MotionSample = { x: 0, y: 0 }; // Raw input from motion provider
  private offset: MotionSample = { x: 0, y: 0 }; // Lerped/smoothed offset for rendering
  private readonly LERP_FACTOR = 0.08; // Controls smoothing (0-1): lower = smoother but more lag

  /** Public read-only access so other renderers can reuse the same offset. */
  getOffset(): MotionSample {
    return this.offset;
  }
  private readonly MAX_SHIFT = 80; // css-px at full tilt - increased for more noticeable background movement
  private debugElement: HTMLElement | null = null;

  constructor() {
    this.logger.debug('BackgroundRenderer instantiated');
    this.motionProvider = chooseMotionProvider();

    // Initialize debug display in development mode
    if (IS_DEV) {
      this.createDebugElement();
    }

    this.startMotionTracking();
  }

  private createDebugElement() {
    if (typeof document === 'undefined') return;

    const elementId = `${DEBUG_ELEMENT_ID_PREFIX}Background`;
    document.getElementById(elementId)?.remove(); // HMR cleanup

    this.debugElement = document.createElement('div');
    this.debugElement.id = elementId; // Set ID for HMR cleanup
    this.debugElement.style.position = 'fixed';
    this.debugElement.style.bottom = '50px';
    this.debugElement.style.left = '10px';
    this.debugElement.style.background = 'rgba(0,0,0,0.5)';
    this.debugElement.style.color = 'white';
    this.debugElement.style.padding = '5px';
    this.debugElement.style.fontSize = '12px';
    this.debugElement.style.zIndex = '9999';
    this.debugElement.style.pointerEvents = 'none';
    this.debugElement.textContent = 'Parallax: Initializing...';
    document.body.appendChild(this.debugElement);
  }

  private async startMotionTracking(): Promise<void> {
    const initialProvider = this.motionProvider;
    try {
      // Store raw values from motion provider, but don't directly use them for rendering
      await initialProvider.start((v) => (this.rawOffset = v));

      if (initialProvider instanceof GyroProvider) {
        if (initialProvider.isActive()) {
          this.logger.info('Gyro motion provider started successfully.');
          return; // Gyro started, no need to fallback.
        } else {
          this.logger.warn(
            'GyroProvider did not become active (e.g., permission denied or no sensor). Attempting fallback.',
          );
          this.activeProviderFailed = true;
        }
      } else if (initialProvider instanceof DummyScrollProvider) {
        // DummyScrollProvider is assumed to be active once start is called without error.
        this.logger.info('DummyScrollProvider started (was initial choice).');
        return; // Dummy started, no need to fallback.
      }
    } catch (error) {
      this.logger.error('Error starting initial motion provider:', error);
      this.activeProviderFailed = true;
    }

    // Fallback logic: only if activeProviderFailed is true and the initial provider was GyroProvider.
    if (this.activeProviderFailed && initialProvider instanceof GyroProvider) {
      this.logger.info('Falling back to DummyScrollProvider for background motion.');
      if (initialProvider) {
        initialProvider.stop(); // Stop the failed/inactive GyroProvider.
      }

      // Dynamically import the module to get the DummyScrollProvider class if needed,
      // though it's already imported statically for `instanceof` checks.
      // Using the statically imported class is cleaner.
      this.motionProvider = new DummyScrollProvider();
      this.motionProvider.start((v) => (this.rawOffset = v));
      this.logger.info('DummyScrollProvider started as fallback.');
    }
  }

  update(_dt: number): void {
    // Apply lerping to smooth out the motion
    this.offset.x = this.offset.x + (this.rawOffset.x - this.offset.x) * this.LERP_FACTOR;
    this.offset.y = this.offset.y + (this.rawOffset.y - this.offset.y) * this.LERP_FACTOR;

    // Update debug information display
    if (this.debugElement) {
      // Only update about 4 times per second to avoid excessive DOM updates
      const now = Date.now();
      if (!this._lastDebugUpdate || now - this._lastDebugUpdate > DEBUG_MOTION_THROTTLE_MS) {
        // Use constant
        const pixelShiftX = this.offset.x * this.MAX_SHIFT;
        const pixelShiftY = this.offset.y * this.MAX_SHIFT;
        this.debugElement.textContent = `Parallax: ${pixelShiftX.toFixed(1)}px, ${pixelShiftY.toFixed(1)}px`;
        this._lastDebugUpdate = now;
      }
    }
  }

  // Keep track of last debug update time
  private _lastDebugUpdate = 0;

  draw(delta: number, ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // undo the global scale(dpr,dpr)

    /* let the theme effect have first shot at painting */
    // Theme.theme.effect.update expects CSS pixels for its drawing logic if it's an ImageEffect
    // or if it's drawing based on CSS dimensions. However, since we've reset the transform,
    // it will draw in raw canvas pixels. If the effect needs to know the CSS dimensions,
    // it should use cssSize(ctx.canvas).
    const painted = Theme.theme?.effect?.update(delta, ctx);

    if (!painted) {
      // We are in *internal* pixels now, so use canvas width/height directly (which are already dpr scaled)
      // or if fillRect needs CSS pixels, multiply cssSize by dpr.
      // Given fillRect operates on the current transform, and we've reset it to identity,
      // we should fill the entire canvas using its actual pixel dimensions.
      ctx.fillStyle = backgroundColour();
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Use actual canvas pixel dimensions
    }

    ctx.restore(); // back to dpr-scaled space for bubbles
  }

  /* resize hook from ResizeService */
  handleResize(w: number, h: number, dpr: number) {
    Theme.theme.effect.resize(w, h, dpr);
  }

  // Call this method if the renderer is being destroyed or background changes
  public dispose(): void {
    if (this.motionProvider) {
      this.motionProvider.stop();
      this.logger.debug('Motion provider stopped.');
    }

    // Clean up debug element
    if (this.debugElement && this.debugElement.parentNode) {
      this.debugElement.parentNode.removeChild(this.debugElement);
      this.debugElement = null;
      this.logger.debug('Debug display removed.');
    }
  }
}
