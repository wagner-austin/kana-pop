import Bubble from '../entities/Bubble.js';
import { COLOURS, SPAWN_INTERVAL } from '../constants.js';
import BackgroundRenderer from '../renderers/BackgroundRenderer.js';
import BubbleRenderer from '../renderers/BubbleRenderer.js';
import Logger from '../utils/Logger.js';

const log = new Logger('Play');
let fpsTimer = 0;
let frames = 0;

const randColor = () => COLOURS[Math.floor(Math.random() * COLOURS.length)];

export default function makePlay(ctx: CanvasRenderingContext2D) {
  let bubbles: Bubble[] = [];
  let spawn = 0;
  const bg = new BackgroundRenderer();
  const br = new BubbleRenderer();

  return {
    update(dt: number) {
      // === FPS log ============================
      fpsTimer += dt;
      frames++;
      if (fpsTimer >= 1) {
        const fps = Math.round(frames / fpsTimer);
        log.debug('fps', fps);
        fpsTimer = 0;
        frames = 0;
      }

      spawn -= dt;
      if (spawn <= 0) {
        const b = new Bubble(Math.random(), randColor());
        bubbles.push(b);
        log.debug('spawned bubble', bubbles.length);
        spawn = SPAWN_INTERVAL;
      }

      bg.update(dt);
      bg.draw(ctx);

      bubbles.forEach(b => br.render(ctx, b));

      // Cull inactive entities
      if (bubbles.some(b => !b.active)) {
        bubbles = bubbles.filter(b => b.active);
      }
    }
  };
}
