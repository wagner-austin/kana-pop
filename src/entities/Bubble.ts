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
    // TODO: Add logic to deactivate bubble if it goes off-screen (e.g., y < 0)
  }

  contains(clickPixelX: number, clickPixelY: number, canvasWidth: number, canvasHeight: number): boolean {
    if (!this.active) return false;

    const bubblePixelX = this.x * canvasWidth;
    const bubblePixelY = this.y * canvasHeight;

    const dx = clickPixelX - bubblePixelX;
    const dy = clickPixelY - bubblePixelY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared <= BUBBLE_RADIUS * BUBBLE_RADIUS;
  }
}
