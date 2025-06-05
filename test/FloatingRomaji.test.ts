import { describe, it, expect } from 'vitest';
import FloatingRomaji from '@/entities/FloatingRomaji';

describe('FloatingRomaji', () => {
  it('drifts upward like a bubble', () => {
    const f = new FloatingRomaji(0.5, 0.5, 'ka');
    f.step(1);
    expect(f.y).toBeCloseTo(0.3); // 0.5 - 0.2*1
  });
});
