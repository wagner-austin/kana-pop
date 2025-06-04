import Logger from '../utils/Logger';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  constructor(public x: number, public color: string) {
    log.debug('spawn', { x: this.x.toFixed(2), color });
  }
  // kept intentionally dumb – no Canvas API here

  pop() {
    log.info('pop!');
    this.active = false;
    // Add any other logic for when a bubble is popped, e.g., sound effects, score updates
  }
}
