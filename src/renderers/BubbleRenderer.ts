// src/renderers/BubbleRenderer.ts
// This class is intended to handle the rendering of individual bubbles.
// For now, Bubble entities manage their own drawing via their .draw() method as per Play.ts pseudo-code.
// This class can be expanded in the future.
import { bubbleRadius, BUBBLE_ALPHA } from '../constants';
import type Bubble from '../entities/Bubble';
import { cssSize } from '../utils/canvasMetrics';

export default class BubbleRenderer {
  render(ctx: CanvasRenderingContext2D, b: Bubble): void {
    ctx.save();
    ctx.beginPath();
    const { w, h } = cssSize(ctx.canvas);
    ctx.arc(b.x * w,
            b.y * h,
            bubbleRadius(), 0, Math.PI * 2); // Fetch radius at render time
    ctx.fillStyle   = b.color;
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fill();
    ctx.restore();
  }
}
