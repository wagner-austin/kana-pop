import Bubble from '../entities/Bubble';
import { COLOURS, SPAWN_INTERVAL } from '../constants';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';
import { cssSize, applyDprTransform } from '../utils/canvasMetrics';
import ResizeService from '../services/ResizeService';

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
  let prevCssW = ctx.canvas.clientWidth;
  let prevCssH = ctx.canvas.clientHeight;
  let spawn = 0;
  const bubbleRenderer = new BubbleRenderer();
  const backgroundRenderer = new BackgroundRenderer();

  const handleResize = () => {
    const { w: newW, h: newH } = cssSize(ctx.canvas);

    if (prevCssW === 0 || prevCssH === 0) { // Avoid division by zero on initial load if dimensions are 0
      prevCssW = newW;
      prevCssH = newH;
      return;
    }

    const sx = newW / prevCssW;
    const sy = newH / prevCssH;

    if (!Number.isFinite(sx) || sx === 0 ||
        !Number.isFinite(sy) || sy === 0) {
      // Update prevW/prevH even if scaling factors are invalid to prevent issues on subsequent resizes
      prevCssW = newW;
      prevCssH = newH;
      return;
    }

    bubbles.forEach(bubble => {
      // Multiply by inverse factors to keep pixel positions stable relative to new viewport
      // This assumes bubble.x and bubble.y are normalized (0-1) coordinates
      // If they are pixel coordinates, the logic would be bubble.x *= sx; bubble.y *= sy;
      // Based on `new Bubble(Math.random(), 1.0, randColor())`, they seem to be normalized.
      // However, the prompt asks for `bubble.x * (1/sx)` which implies they are NOT normalized
      // or that the scaling logic is intended to counteract a different effect.
      // Sticking to the prompt's direct instruction for inverse scaling:
      if (sx !== 0) bubble.x /= sx; 
      if (sy !== 0) bubble.y /= sy;
    });

    prevCssW = newW;
    prevCssH = newH;
  };

  const handlePointerDown = (event: PointerEvent) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const clickPixelX = event.clientX - rect.left;
    const clickPixelY = event.clientY - rect.top;

    // Iterate in reverse so top-most bubbles are checked first
    const { w, h } = cssSize(ctx.canvas);         // << once
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      if (bubble && bubble.contains(clickPixelX, clickPixelY, w, h)) {
        bubble.pop();
        // Optional: break here if only one bubble can be popped per click
        break; 
      }
    }
  };

  return {
    update(dt: number) {
      applyDprTransform(ctx);
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
      ResizeService.subscribe(handleResize);
      // Call handleResize once initially to set correct scaling if canvas size differs from prevW/prevH defaults
      handleResize(); 
      ctx.canvas.addEventListener('pointerdown', handlePointerDown);
    },
    exit() {
      log.info('Play screen exited');
      ResizeService.unsubscribe(handleResize);
      ctx.canvas.removeEventListener('pointerdown', handlePointerDown);
      // Clear bubbles or other screen-specific state if necessary
      bubbles = []; 
    }
  };
}
