import Bubble from './Bubble';

/**
 * A static “target” bubble drawn at the top of the screen that shows
 * the romaji to hit.  It inherits all visuals (squish, flash, colours)
 * but never drifts upward nor reacts to taps.
 */
export default class IndicatorBubble extends Bubble {
  /** Indicator sits still → speed 0 and no y-drift in step(). */
  constructor(x: number, y: number, colour: string, glyph: string, romaji: string, radius: number) {
    super(x, y, colour, glyph, romaji, radius);
    this.speed = 0; // never drifts upward
    this.showingRomaji = true; // use romaji font ratio consistently
  }

  /** Keep animation timers but cancel vertical drift. */
  override step(dt: number): void {
    const originalY = this.y;
    super.step(dt);
    this.y = originalY; // ensure no vertical change
  }
}
