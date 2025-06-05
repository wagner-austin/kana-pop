import {
  BUBBLE_ALPHA,
  FONT_FAMILY,
  FONT_COLOUR,
  KANA_FONT_RATIO,
  BUBBLE_STROKE_WIDTH,
  BUBBLE_FLASH_ALPHA,
} from '../config/constants';

import type Bubble from '@/entities/Bubble';

export default class BubbleRenderer {
  /**
   * We still accept parallax parameter for API consistency, but bubbles now stay in place
   * while the background moves for the parallax effect.
   */
  render(
    ctx: CanvasRenderingContext2D,
    b: Bubble,
    w: number,
    h: number,
    _parallax?: { x: number; y: number }, // Unused but kept for API consistency
  ): void {
    // No parallax shifting applied to bubbles - they stay in place
    const pxX = b.x * w;
    const pxY = b.y * h;
    const r = b.r * b.scale; // ← squash / stretch

    // circle
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(pxX, pxY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ---- kana glyph ---- */
    const label = b.showingRomaji ? b.romaji : b.glyph;
    const ratio = b.showingRomaji ? 0.45 : KANA_FONT_RATIO;

    ctx.fillStyle = FONT_COLOUR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(r * ratio)}px ${FONT_FAMILY}`;
    ctx.fillText(label, pxX, pxY);

    /* ---- white rim flash ---- */
    if (b.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = b.flashAlpha * BUBBLE_FLASH_ALPHA;
      ctx.lineWidth = BUBBLE_STROKE_WIDTH;
      ctx.strokeStyle = '#ffffff';

      ctx.beginPath();
      ctx.arc(pxX, pxY, r + BUBBLE_STROKE_WIDTH * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
