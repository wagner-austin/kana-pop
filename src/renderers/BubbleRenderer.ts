import { BUBBLE_ALPHA, FONT_FAMILY, FONT_COLOUR, KANA_FONT_RATIO } from '../config/constants';

import type Bubble from '@/entities/Bubble';

export default class BubbleRenderer {
  render(ctx: CanvasRenderingContext2D, b: Bubble, w: number, h: number): void {
    const pxX = b.x * w;
    const pxY = b.y * h;
    const r = b.r;

    // circle
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(pxX, pxY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---- kana glyph ----
    const label = b.showingRomaji ? b.romaji : b.glyph;
    const ratio = b.showingRomaji ? 0.45 : KANA_FONT_RATIO;

    ctx.fillStyle = FONT_COLOUR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(r * ratio)}px ${FONT_FAMILY}`;
    ctx.fillText(label, pxX, pxY);
  }
}
