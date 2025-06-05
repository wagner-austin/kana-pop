import { bubbleRadius, BUBBLE_ALPHA, FONT_FAMILY, FONT_COLOUR, KANA_FONT_RATIO } from '@/constants';
import Bubble from '@/entities/Bubble';
import { cssSize } from '@/utils/canvasMetrics';

export default class BubbleRenderer {
  render(ctx: CanvasRenderingContext2D, b: Bubble): void {
    const { w, h } = cssSize(ctx.canvas);
    const pxX = b.x * w;
    const pxY = b.y * h;
    const r = bubbleRadius();

    // circle
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(pxX, pxY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---- kana glyph ----
    ctx.fillStyle = FONT_COLOUR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(r * KANA_FONT_RATIO)}px ${FONT_FAMILY}`;
    ctx.fillText(b.kana, pxX, pxY);
  }
}
