export function cssSize(canvas: HTMLCanvasElement) {
  const { clientWidth: w, clientHeight: h } = canvas;
  return { w, h };
}

export function dpr(canvas: HTMLCanvasElement) {
  return canvas.width / canvas.clientWidth; // always integer ≥ 1
}

export function getWindowDpr(): number {
  return window.devicePixelRatio || 1; // just ask the browser each time
}

export function applyDprTransform(ctx: CanvasRenderingContext2D) {
  const dpr = getWindowDpr();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any prior scaling
  ctx.scale(dpr, dpr); // draw at device-pixel accuracy
}
