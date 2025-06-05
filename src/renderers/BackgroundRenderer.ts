// src/renderers/BackgroundRenderer.ts
import { BACKGROUND_COLOUR } from '../config/constants';
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
  private readonly MAX_SHIFT = 30; // css-px at full tilt

  constructor() {
    this.logger.debug('BackgroundRenderer instantiated');
    this.motionProvider = chooseMotionProvider();
    this.startMotionTracking();
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
    // However, if we had other time-based animations for the background,
    // they would go here.
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { w, h } = cssSize(ctx.canvas); // css-pixel values

    /* ----- solid colour base ----- */
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, w, h);

    /* ----- simple star-field layer with parallax ----- */
    ctx.save();
    // Apply parallax shift
    ctx.translate(this.offset.x * this.MAX_SHIFT, this.offset.y * this.MAX_SHIFT);

    const step = 80; // Spacing of stars
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
        ctx.fillRect(x, y, 2, 2); // Star size
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
  }
}
