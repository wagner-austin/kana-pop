// src/renderers/BackgroundRenderer.ts
import {
  BACKGROUND_COLOUR,
  IS_DEV,
  DEBUG_MOTION_THROTTLE_MS,
  DEBUG_ELEMENT_ID_PREFIX,
} from '../config/constants';
import { cssSize } from '../utils/canvasMetrics';
import Logger from '../utils/Logger';

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
  private offset: MotionSample = { x: 0, y: 0 };
  private readonly MAX_SHIFT = 50; // css-px at full tilt - increased for more noticeable effect
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
      await initialProvider.start((v) => (this.offset = v));

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
      this.motionProvider.start((v) => (this.offset = v));
      this.logger.info('DummyScrollProvider started as fallback.');
    }
  }

  update(_dt: number): void {
    // No time-based updates needed here for the offset itself;
    // it's updated directly by the motion provider's callback.

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

  draw(ctx: CanvasRenderingContext2D): void {
    const { w, h } = cssSize(ctx.canvas); // css-pixel values

    /* ----- solid colour base ----- */
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, w, h);

    /* ----- simple star-field layer with parallax ----- */
    ctx.save();
    // Apply parallax shift
    const shiftX = this.offset.x * this.MAX_SHIFT;
    const shiftY = this.offset.y * this.MAX_SHIFT;
    ctx.translate(shiftX, shiftY);

    const step = 40; // Spacing of stars - reduced for density
    const starSize = 2; // Size of stars in pixels - increased for visibility
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; // Star color and transparency

    // Calculate bounds for drawing stars to cover the canvas even when shifted
    const startX = -this.MAX_SHIFT - step;
    const startY = -this.MAX_SHIFT - step;
    const endX = w + this.MAX_SHIFT + step;
    const endY = h + this.MAX_SHIFT + step;

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        // Add a little pseudo-randomness to star positions if desired
        // For now, a simple grid
        ctx.fillRect(x, y, starSize, starSize); // Star size
      }
    }
    ctx.restore();
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
