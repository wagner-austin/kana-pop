import Logger from '../utils/Logger';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  constructor(public x: number, public color: string) {
    log.debug('spawn', { x: this.x.toFixed(2), color });
  }
  draw(ctx: CanvasRenderingContext2D, _dt: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x * ctx.canvas.width, ctx.canvas.height - 40, 20, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();
  }

  pop() {
    log.info('pop!');
    this.active = false;
    // Add any other logic for when a bubble is popped, e.g., sound effects, score updates
  }
}
