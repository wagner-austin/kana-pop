/** @internal - do not import outside ResizeService */
export default function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const { clientWidth: w, clientHeight: h } = canvas;

  canvas.width  = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  return { w, h, dpr };
}
