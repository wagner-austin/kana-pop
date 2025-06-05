export function cssSize(canvas: HTMLCanvasElement) {
  const { clientWidth: w, clientHeight: h } = canvas;
  return { w, h };
}

export function dpr(canvas: HTMLCanvasElement) {
  return canvas.width / canvas.clientWidth; // always integer ≥ 1
}

export function getWindowDpr(): number {
  return window.devicePixelRatio || 1;
}

export function applyDprTransform(ctx: CanvasRenderingContext2D) {
  const dpr = getWindowDpr();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to identity
  ctx.scale(dpr, dpr);
}
