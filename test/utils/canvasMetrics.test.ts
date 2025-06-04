import { describe, it, expect, vi } from 'vitest';
import { applyDprTransform } from '@/utils/canvasMetrics';

describe('applyDprTransform', () => {
  it('applies correct scale', () => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    // Spy on setTransform / scale
    const set = vi.spyOn(ctx, 'setTransform');
    const scale = vi.spyOn(ctx, 'scale');

    applyDprTransform(ctx);
    expect(set).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(scale).toHaveBeenCalledWith(window.devicePixelRatio, window.devicePixelRatio);
  });
});
