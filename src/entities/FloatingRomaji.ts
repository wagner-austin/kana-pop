import { bubbleRadius, FONT_FAMILY, FONT_COLOUR } from '@/constants';
import { cssSize } from '@/utils/canvasMetrics';

export default class FloatingRomaji {
  /** normalised coords (0-1) so they scale with resize/DPR */
  constructor(
    public x: number,
    public y: number,
    public text: string,
    public speed = 0.2, // match Bubble.speed
    public ttl = 1, // seconds
  ) {}

  step(dt: number): void {
    this.ttl -= dt;
    this.y -= this.speed * dt; // identical physics
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.ttl <= 0) return;

    const { w, h } = cssSize(ctx.canvas);
    const r = bubbleRadius();

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.ttl); // linear fade
    ctx.fillStyle = FONT_COLOUR;
    ctx.font = `${Math.round(r * 0.7)}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x * w, this.y * h);
    ctx.restore();
  }
}
