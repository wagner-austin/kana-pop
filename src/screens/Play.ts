import Bubble from '../entities/Bubble';
import paletteJson from '../data/palette.json';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import Logger from '../utils/Logger';

const log = new Logger('Play');
let fpsTimer = 0;

const COLORS = paletteJson.colors;
const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function makePlay(ctx: CanvasRenderingContext2D) {
  const bubbles: Bubble[] = [];
  let spawn = 0;
  const bg = new BackgroundRenderer();

  return {
    update(dt: number) {
      fpsTimer += dt;
      if (fpsTimer >= 1) { // once per second
        log.debug('fps', (1/dt).toFixed(0));
        fpsTimer = 0;
      }

      spawn -= dt;
      if (spawn <= 0) {
        const b = new Bubble(Math.random(), randColor());
        bubbles.push(b);
        log.debug('spawned bubble', bubbles.length);
        spawn = 1.2;
      }

      bg.update(dt);
      bg.draw(ctx);

      bubbles.forEach(b => b.draw(ctx, dt));
    }
  };
}
