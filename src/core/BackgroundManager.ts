import ResizeService from '@/services/ResizeService';
import Theme from '@/services/ThemeService';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';

export default class BackgroundManager {
  private ctx: CanvasRenderingContext2D;
  private time = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const c = canvas.getContext('2d');
    if (!c) throw new Error('2-D context not available');
    this.ctx = c;

    ResizeService.watchCanvas(canvas);
    ResizeService.subscribe(() => this.paint(0)); // redraw on resize / DPR changes
  }

  /** Call once per RAF **before** game scenes paint. */
  paint(dt: number) {
    this.time += dt;
    applyDprTransform(this.ctx); // ← same as before (scales by DPR)

    /* ── keep backdrop size constant even if DPR changes ───────── */
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.scale(1 / dpr, 1 / dpr); // ← cancels the scale

    const painted = Theme.theme?.effect?.update(dt, this.ctx);
    if (!painted) {
      const { w, h } = cssSize(this.canvas); // cssSize gives *CSS* pixels
      this.ctx.fillStyle = Theme.theme?.palette[2] ?? '#c7ceea';
      this.ctx.fillRect(0, 0, w, h);
    }

    this.ctx.restore(); // back to normal for next frame
  }
}
