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
  /** parallax = motion offset in –1..1 — pass null for none (tests). */
  render(
    ctx: CanvasRenderingContext2D,
    b: Bubble,
    w: number,
    h: number,
    parallax?: { x: number; y: number },
  ): void {
    const PARALLAX_STRENGTH = 20; // css-px max bubble shift (≈⅓ of stars)
    // Bubbles move *opposite* the background so the effect is obvious.
    const shiftX = (parallax?.x ?? 0) * -PARALLAX_STRENGTH;
    const shiftY = (parallax?.y ?? 0) * -PARALLAX_STRENGTH;

    const pxX = b.x * w + shiftX;
    const pxY = b.y * h + shiftY;
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
