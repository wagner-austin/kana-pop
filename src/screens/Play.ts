import Bubble from '../entities/Bubble';
import { COLOURS, SPAWN_INTERVAL } from '../constants';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';
import { cssSize, applyDprTransform } from '../utils/canvasMetrics';
import ResizeService from '../services/ResizeService';
import Lang from '../services/LanguageService';
import Sound from '../services/SoundService';
import Popup from '../entities/Popup';
import type { SymbolDef } from '../services/LanguageService';

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
  let popups: Popup[] = [];
  let ready = false;

  const FALLBACK_SYMBOL: SymbolDef = { char: '?', roman: '?', audio: 'fallback.mp3' }; // Define a fallback

  const randSymbol = (): SymbolDef => {
    if (!Lang.symbols || Lang.symbols.length === 0) {
      log.error('randSymbol called but Lang.symbols is empty. Returning fallback symbol.');
      return FALLBACK_SYMBOL;
    }
    // This assumes Lang.symbols is populated and non-empty by the time it's called.
    // Error handling for empty symbols array might be needed depending on game robustness requirements.
    return Lang.symbols[Math.floor(Math.random() * Lang.symbols.length)]!;
  };

  const handleResize = () => {
    const { w: newW, h: newH } = cssSize(ctx.canvas);

    if (prevCssW === 0 || prevCssH === 0) {
      // Avoid division by zero on initial load if dimensions are 0
      prevCssW = newW;
      prevCssH = newH;
      return;
    }

    const sx = newW / prevCssW;
    const sy = newH / prevCssH;

    if (!Number.isFinite(sx) || sx === 0 || !Number.isFinite(sy) || sy === 0) {
      // Update prevW/prevH even if scaling factors are invalid to prevent issues on subsequent resizes
      prevCssW = newW;
      prevCssH = newH;
      return;
    }

    // Bubbles are already stored as normalised [0-1] coordinates.
    // No positional adjustment is necessary on resize.

    prevCssW = newW;
    prevCssH = newH;
  };

  const handlePointerDown = (event: PointerEvent) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const clickPixelX = event.clientX - rect.left;
    const clickPixelY = event.clientY - rect.top;

    // Iterate in reverse so top-most bubbles are checked first
    const { w, h } = cssSize(ctx.canvas); // << once
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bubble = bubbles[i];
      if (bubble && bubble.contains(clickPixelX, clickPixelY, w, h)) {
        bubble.pop();
        Sound.play(`${Lang.currentCode}/${bubble.sym.audio}`);
        popups.push(new Popup(clickPixelX, clickPixelY, bubble.sym.roman));
        // Optional: break here if only one bubble can be popped per click
        break;
      }
    }
  };

  return {
    update(dt: number) {
      if (!ready) return; // skip the frame until we’re loaded
      applyDprTransform(ctx);
      const rawDt = dt; // keep the real frame time for diagnostics
      dt = Math.min(rawDt, 0.1); // physics clamp

      // === FPS log ============================
      fpsTimer += rawDt; // use the true elapsed time
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
        const s = randSymbol();
        const b = new Bubble(Math.random(), 1.0, randColor(), s); // y=1.0 is bottom of screen
        bubbles.push(b);
        log.debug('spawned bubble', bubbles.length);
        spawn = SPAWN_INTERVAL;
      }

      // ── Cull inactive entities *before* drawing ────────────────────────
      //   so popped bubbles don’t get rendered for an extra frame.
      if (bubbles.some((b) => !b.active)) {
        bubbles = bubbles.filter((b) => b.active);
      }
      // Filter out expired popups
      if (popups.some((p) => p.ttl <= 0)) {
        popups = popups.filter((p) => p.ttl > 0);
      }

      backgroundRenderer.update(dt);

      // Update bubble positions
      bubbles.forEach((b) => b.step(dt));

      // Update popup positions and TTL
      popups.forEach((p) => p.step(dt));

      backgroundRenderer.draw(ctx);

      bubbles.forEach((b) => bubbleRenderer.render(ctx, b));

      // Draw popups
      popups.forEach((p) => p.draw(ctx));
    },
    async enter() {
      log.info('Play screen entered');
      await Lang.load('ja'); // blocks until JSON parsed
      ready = true;
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
      popups = []; // Clear popups as well
    },
  };
}
