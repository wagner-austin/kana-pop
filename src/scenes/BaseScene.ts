import type StateMachine from '@/core/StateMachine';
import ResizeService from '@/services/ResizeService';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';

export default abstract class BaseScene {
  protected readonly ctx: CanvasRenderingContext2D;
  protected readonly sm: StateMachine;

  private resizeHandler = this.paint.bind(this);

  constructor(sm: StateMachine, ctx: CanvasRenderingContext2D) {
    this.sm = sm;
    this.ctx = ctx;
  }

  /** Called automatically by the StateMachine – don’t call yourself. */
  async enter(): Promise<void> {
    ResizeService.subscribe(this.resizeHandler);
    this.paint(); // first frame
  }

  /** Real-time scenes override if they need dt. */
  update(_dt: number): void {}

  /** Paired with enter() – never forget to detach. */
  exit(): void {
    ResizeService.unsubscribe(this.resizeHandler);
  }

  /* ------------------------------------------------------------------ */
  protected abstract paint(): void;

  /** Clears the canvas and reapplies DPR.  Returns {w,h} for convenience. */
  protected clear() {
    const { w, h } = cssSize(this.ctx.canvas);
    this.ctx.clearRect(0, 0, w, h);
    applyDprTransform(this.ctx);
    return { w, h };
  }
}
