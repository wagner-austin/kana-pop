// src/renderers/BackgroundRenderer.ts
import { BACKGROUND_COLOUR } from '../constants';
export default class BackgroundRenderer {
  constructor() {
    // Initialization for background, e.g., load images, set up gradients
    // console.log('BackgroundRenderer instantiated');
  }

  update(_dt: number): void {
    // Update logic for animated backgrounds (e.g., parallax scrolling, gradient shifts)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    // Using a distinct color for the play screen background for now
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, width, height);
  }
}
