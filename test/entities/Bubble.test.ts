import { describe, it, expect } from 'vitest';
import Bubble from '@/entities/Bubble';
import { BUBBLE_BASE_SPEED } from '@/config/constants';

const mockKana = 'テ';
const mockRomaji = 'te';

describe('Bubble', () => {
  it('moves upward over time', () => {
    const b = new Bubble(0.5, 1.0, '#fff', mockKana, mockRomaji, 10);
    b.step(1);
    expect(b.y).toBeCloseTo(1 + BUBBLE_BASE_SPEED, 3);
  });

  it('becomes inactive when above top', () => {
    const b = new Bubble(0.5, 1.04, '#fff', mockKana, mockRomaji, 10);
    // choose dt so that y exceeds 1.05 threshold
    const dt = 0.02 / BUBBLE_BASE_SPEED;
    b.step(dt);
    expect(b.active).toBe(false);
  });

  it('detects pointer hits', () => {
    const b = new Bubble(0.5, 0.5, '#fff', mockKana, mockRomaji, 10);
    // canvas 100×100 ⇒ bubble centre (50,50) px. Hit at 48, 48.
    expect(b.contains(48, 48, 100, 100)).toBe(true);
  });
});
