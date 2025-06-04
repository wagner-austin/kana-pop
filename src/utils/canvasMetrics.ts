export function cssSize(canvas: HTMLCanvasElement) {
  const { clientWidth: w, clientHeight: h } = canvas;
  return { w, h };
}

export function dpr(canvas: HTMLCanvasElement) {
  return canvas.width / canvas.clientWidth;          // always integer ≥ 1
}
