import Bubble from '../entities/Bubble';
import { COLOURS, SPAWN_INTERVAL } from '../constants';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';

const log = new Logger('Play');
let fpsTimer = 0;
let frames = 0;

const randColor = () => COLOURS[Math.floor(Math.random() * COLOURS.length)];

export default function makePlay(ctx: CanvasRenderingContext2D) {
  let bubbles: Bubble[] = [];
  let spawn = 0;
  const bubbleRenderer = new BubbleRenderer();
  const backgroundRenderer = new BackgroundRenderer();

  return {
    update(dt: number) {
      dt = Math.min(dt, 0.1); // Clamp dt to prevent large jumps
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

      // ── Cull inactive entities *before* drawing ────────────────────────
      //   so popped bubbles don’t get rendered for an extra frame.
      if (bubbles.some(b => !b.active)) {
        bubbles = bubbles.filter(b => b.active);
      }

      backgroundRenderer.update(dt);
      backgroundRenderer.draw(ctx);

      bubbles.forEach(b => bubbleRenderer.render(ctx, b));
    }
  };
}
