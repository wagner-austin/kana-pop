import Logger from '../utils/Logger';
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
}
