import {
  BUBBLE_ALPHA,
  FONT_FAMILY,
  FONT_COLOUR,
  KANA_FONT_RATIO,
  ROMAJI_FONT_RATIO,
  BUBBLE_FLASH_ALPHA,
  BUBBLE_STROKE_WIDTH,
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
    _waste?: unknown, // Unused but kept for API consistency
  ): void {
    // No parallax shifting applied to bubbles - they stay in place
    const pxX = b.x * w;
    const pxY = b.y * h;
    // Use the unified scale for a uniform bubble squish animation
    const radius = b.r * b.scale; // scaled radius

    // circle
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fillStyle = b.color;
    ctx.beginPath();

    // Draw circle with the scaled radius
    ctx.beginPath();
    ctx.arc(pxX, pxY, radius, 0, Math.PI * 2);

    ctx.fill();
    ctx.restore();

    /* ---- kana/romaji text with fade transition ---- */
    const label = b.showingRomaji ? b.romaji : b.glyph;
    const ratio = b.showingRomaji ? ROMAJI_FONT_RATIO : KANA_FONT_RATIO;

    // Use the text-specific scale factor
    const labelSize = Math.round(b.r * b.currentTextScale * ratio);

    // Apply text opacity for fade effect
    ctx.save();
    ctx.fillStyle = FONT_COLOUR;
    ctx.globalAlpha = b.currentTextOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${labelSize}px ${FONT_FAMILY}`;
    ctx.fillText(label, pxX, pxY);
    ctx.restore();

    /* ---- white rim flash ---- */
    if (b.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = b.flashAlpha * BUBBLE_FLASH_ALPHA;
      ctx.lineWidth = BUBBLE_STROKE_WIDTH;
      ctx.strokeStyle = '#ffffff';

      // Draw circular stroke with the scaled radius
      ctx.beginPath();
      ctx.arc(pxX, pxY, radius + BUBBLE_STROKE_WIDTH * 0.5, 0, Math.PI * 2);

      ctx.stroke();
      ctx.restore();
    }
  }
}
