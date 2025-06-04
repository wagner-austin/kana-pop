import { describe, it, expect } from 'vitest';
import Bubble from '@/entities/Bubble';

describe('Bubble', () => {
  it('moves upward over time', () => {
    const b = new Bubble(0.5, 1.0, '#fff');
    b.step(1);                   // 1 s at 0.2 h/s → y decreases by 0.2
    expect(b.y).toBeCloseTo(0.8);
  });

  it('becomes inactive when above top', () => {
    const b = new Bubble(0.5, 0.0, '#fff');
    b.step(0.3);                 // -0.06 → y = -0.06 < -0.05 sentinel
    expect(b.active).toBe(false);
  });

  it('detects pointer hits', () => {
    const b = new Bubble(0.5, 0.5, '#fff');
    // canvas 100×100 ⇒ bubble centre (50,50) px. Hit at 48, 48.
    expect(b.contains(48, 48, 100, 100)).toBe(true);
  });
});
