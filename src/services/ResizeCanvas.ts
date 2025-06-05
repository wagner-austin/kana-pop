import { cssSize, getWindowDpr } from '../utils/canvasMetrics';

/** @internal - do not import outside ResizeService */
export default function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = getWindowDpr();
  const { w, h } = cssSize(canvas);

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  return { w, h, dpr };
}
