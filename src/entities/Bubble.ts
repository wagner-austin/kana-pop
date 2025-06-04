import Logger from '../utils/Logger';
import { BUBBLE_RADIUS } from '../constants';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  public speed: number = 0.2; // fraction of canvas height per second

  constructor(public x: number, public y: number, public color: string) {
    log.debug('spawn', { x: this.x.toFixed(2), color });
  }
  // kept intentionally dumb – no Canvas API here

  pop() {
    log.info('pop!');
    this.active = false;
    // Add any other logic for when a bubble is popped, e.g., sound effects, score updates
  }

  step(dt: number) {
    this.y -= this.speed * dt;
    if (this.y < -0.05) this.active = false;   // slight overshoot so it’s fully gone
  }

  contains(clickPixelX: number, clickPixelY: number, cssW: number, cssH: number): boolean {
    if (!this.active) return false;

    const bubblePixelX = this.x * cssW;
    const bubblePixelY = this.y * cssH;

    const dx = clickPixelX - bubblePixelX;
    const dy = clickPixelY - bubblePixelY;
    const distanceSquared = dx * dx + dy * dy;

    const radiusInCssPixels = BUBBLE_RADIUS;
    return distanceSquared <= radiusInCssPixels * radiusInCssPixels;
  }
}
