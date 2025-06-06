import { describe, it, expect } from 'vitest';
import Bubble from '@/entities/Bubble';

describe('Bubble scale easing', () => {
  it('never overshoots 1.0 even with a large dt', () => {
    const b = new Bubble(0, 0, '#fff', 'あ', 'a', 50);
    b.scale = 0.85; // simulate freshly tapped bubble
    b.step(0.25); // big frame (250 ms)
    expect(b.scale).toBeLessThanOrEqual(1);
  });
});
