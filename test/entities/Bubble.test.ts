import { describe, it, expect } from 'vitest';
import Bubble from '@/entities/Bubble';
import { BUBBLE_BASE_SPEED } from '@/config/constants';

const mockKana = 'テ';
const mockRomaji = 'te';

describe('Bubble', () => {
  it('moves upward (decreasing y) over time', () => {
    const startY = 1.0;
    const b = new Bubble(0.5, startY, '#fff', mockKana, mockRomaji, 10);
    b.step(1);
    expect(b.y).toBeCloseTo(startY - BUBBLE_BASE_SPEED, 3);
  });

  it('becomes inactive when leaving top boundary', () => {
    // Place bubble just inside the removal threshold and step a tiny dt
    const b = new Bubble(0.5, -0.04, '#fff', mockKana, mockRomaji, 10);
    const dt = 0.02 / BUBBLE_BASE_SPEED; // small increment that pushes it past -0.05
    b.step(dt);
    expect(b.active).toBe(false);
  });

  it('detects pointer hits', () => {
    const b = new Bubble(0.5, 0.5, '#fff', mockKana, mockRomaji, 10);
    // canvas 100×100 ⇒ bubble centre (50,50) px. Hit at 48, 48.
    expect(b.contains(48, 48, 100, 100)).toBe(true);
  });
});
