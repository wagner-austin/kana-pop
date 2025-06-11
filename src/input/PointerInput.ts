import type BubbleManager from '../managers/BubbleManager';
import Logger from '../utils/Logger';

import type Bubble from '@/entities/Bubble';

const log = new Logger('Pointer');

export default class PointerInput {
  private readonly bound = this.onDown.bind(this);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly bubbles: BubbleManager,
    /** Callback fired when a bubble is successfully tapped */
    private readonly onTap: (b: Bubble) => void,
    /** Optional single extra target (e.g. indicator bubble) */
    private readonly extraTarget?: () => Bubble | null,
  ) {}

  attach() {
    this.canvas.addEventListener('pointerdown', this.bound);
  }

  detach() {
    this.canvas.removeEventListener('pointerdown', this.bound);
  }

  // ────────────────────────────────────────────────────────────
  private onDown(e: PointerEvent | TouchEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const cx =
      'clientX' in e ? (e as PointerEvent).clientX : ((e as TouchEvent).touches[0]?.clientX ?? 0);
    const cy =
      'clientY' in e ? (e as PointerEvent).clientY : ((e as TouchEvent).touches[0]?.clientY ?? 0);

    let hit: Bubble | null = null;

    /* First, check extra target (e.g., header indicator) so it has click priority */
    if (this.extraTarget) {
      const extra = this.extraTarget();
      if (extra && extra.contains(cx - rect.left, cy - rect.top, rect.width, rect.height)) {
        hit = extra;
      }
    }

    /* If extra target not hit, fall back to gameplay bubbles */
    if (!hit) {
      hit = this.bubbles.hitTest(cx - rect.left, cy - rect.top) ?? null;
    }

    if (hit) {
      hit.handleClick(performance.now() / 1000);
      log.debug('hit', { roman: hit.romaji });
      // Notify scene of the successful tap
      this.onTap(hit);
    }
  }
}
