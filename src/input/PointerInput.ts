import type BubbleManager from '../managers/BubbleManager';
import Logger from '../utils/Logger';

const log = new Logger('Pointer');

export default class PointerInput {
  private readonly bound = this.onDown.bind(this);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly bubbles: BubbleManager,
  ) {}

  attach() {
    this.canvas.addEventListener('pointerdown', this.bound);
    this.canvas.addEventListener('touchstart', this.bound);
  }

  detach() {
    this.canvas.removeEventListener('pointerdown', this.bound);
    this.canvas.removeEventListener('touchstart', this.bound);
  }

  // ────────────────────────────────────────────────────────────
  private onDown(e: PointerEvent | TouchEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const cx =
      'clientX' in e ? (e as PointerEvent).clientX : ((e as TouchEvent).touches[0]?.clientX ?? 0);
    const cy =
      'clientY' in e ? (e as PointerEvent).clientY : ((e as TouchEvent).touches[0]?.clientY ?? 0);

    const hit = this.bubbles.hitTest(cx - rect.left, cy - rect.top);
    if (hit) {
      hit.handleClick(performance.now() / 1000);
      log.debug('hit', { roman: hit.romaji });
    }
  }
}
