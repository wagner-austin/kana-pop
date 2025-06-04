// src/renderers/BubbleRenderer.ts
// This class is intended to handle the rendering of individual bubbles.
// For now, Bubble entities manage their own drawing via their .draw() method as per Play.ts pseudo-code.
// This class can be expanded in the future.
import { bubbleRadius, BUBBLE_ALPHA } from '../constants';
import type Bubble from '../entities/Bubble';
import { cssSize } from '../utils/canvasMetrics';

export default class BubbleRenderer {
  render(ctx: CanvasRenderingContext2D, b: Bubble): void {
    const { w, h } = cssSize(ctx.canvas);
    const r = bubbleRadius();

    // Balloon
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x * w, b.y * h, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Glyph centred
    ctx.fillStyle = '#111';
    const fontFamily = '"Noto Sans JP","Noto Sans Symbols2","Noto Sans",sans-serif';
    ctx.font = `${r * 1.4}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.sym.char, b.x * w, b.y * h);
  }
}
