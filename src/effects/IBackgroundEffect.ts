export interface IBackgroundEffect {
  /** called from ResizeService */
  resize(width: number, height: number, dpr: number): void;
  /** per-frame logic (return true if it painted anything) */
  update(delta: number, ctx: CanvasRenderingContext2D): boolean | void;
  /** optional teardown */
  dispose?(): void;
}
