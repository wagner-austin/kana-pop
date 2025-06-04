import { describe, it, expect, vi } from 'vitest';
import ResizeService, { resizeCanvas } from '@/services/ResizeService';

describe('ResizeService', () => {
  it('publishes resize events', () => {
    const cb = vi.fn();
    ResizeService.subscribe(cb);
    window.dispatchEvent(new Event('resize'));
    expect(cb).toHaveBeenCalledTimes(2); // initial + synthetic resize
    ResizeService.unsubscribe(cb);
  });

  it('keeps canvas at DPR', () => {
    const canvas = document.createElement('canvas');
    canvas.style.width = '200px';
    canvas.style.height = '100px';
    Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: 100 });

    const { w, h, dpr } = resizeCanvas(canvas);
    expect(w).toBe(200);
    expect(h).toBe(100);
    expect(canvas.width).toBe(400);  // 2× DPR
    expect(dpr).toBe(2);
  });
});
