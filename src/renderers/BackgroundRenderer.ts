// src/renderers/BackgroundRenderer.ts
import { BACKGROUND_COLOUR } from '../config/constants';
import { cssSize } from '../utils/canvasMetrics';
import Logger from '../utils/Logger';

export default class BackgroundRenderer {
  private logger = new Logger('BackgroundRenderer');

  constructor() {
    // Initialization for background, e.g., load images, set up gradients
    this.logger.debug('BackgroundRenderer instantiated');
  }

  update(_dt: number): void {
    // Update logic for animated backgrounds (e.g., parallax scrolling, gradient shifts)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { w, h } = cssSize(ctx.canvas); // css-pixel values
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, w, h);
  }
}
