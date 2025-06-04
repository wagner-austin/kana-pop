import Bubble from '../entities/Bubble';
import { COLOURS, SPAWN_INTERVAL } from '../constants';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';

const log = new Logger('Play');
let fpsTimer = 0;
let frames = 0;

const randColor = (): string => {
  if (COLOURS.length === 0) return '#FFFFFF'; // Default to white if COLOURS is empty
  const color = COLOURS[Math.floor(Math.random() * COLOURS.length)];
  return color ?? '#FFFFFF'; // Default to white if selected color is somehow undefined
};

export default function makePlay(ctx: CanvasRenderingContext2D) {
  let bubbles: Bubble[] = [];
  let spawn = 0;
  const bubbleRenderer = new BubbleRenderer();
  const backgroundRenderer = new BackgroundRenderer();

  const handlePointerDown = (event: PointerEvent) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const clickPixelX = (event.clientX - rect.left) * window.devicePixelRatio;
    const clickPixelY = (event.clientY - rect.top) * window.devicePixelRatio;

    // Iterate in reverse so top-most bubbles are checked first
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      if (bubble && bubble.contains(clickPixelX, clickPixelY, ctx.canvas.width, ctx.canvas.height)) {
        bubble.pop();
        // Optional: break here if only one bubble can be popped per click
        break; 
      }
    }
  };

  return {
    update(dt: number) {
      const rawDt = dt;             // keep the real frame time for diagnostics
      dt = Math.min(rawDt, 0.1);    // physics clamp
      // === FPS log ============================
      fpsTimer += rawDt;            // use the true elapsed time
      frames++;
      if (fpsTimer >= 1) {
        const fps = Math.round(frames / fpsTimer);
        if (localStorage.getItem('logLevel') === 'debug') {
          log.debug('fps', fps);
        }
        fpsTimer = 0;
        frames = 0;
      }

      spawn -= dt;
      if (spawn <= 0) {
        const b = new Bubble(Math.random(), 1.0, randColor()); // y=1.0 is bottom of screen
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

      // Update bubble positions
      bubbles.forEach(b => b.step(dt));

      backgroundRenderer.draw(ctx);

      bubbles.forEach(b => bubbleRenderer.render(ctx, b));
    },
    enter() {
      log.info('Play screen entered');
      ctx.canvas.addEventListener('pointerdown', handlePointerDown);
    },
    exit() {
      log.info('Play screen exited');
      ctx.canvas.removeEventListener('pointerdown', handlePointerDown);
      // Clear bubbles or other screen-specific state if necessary
      bubbles = []; 
    }
  };
}
