import BubbleManager from '../managers/BubbleManager';
import PointerInput from '../input/PointerInput';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';
import { cssSize, applyDprTransform } from '../utils/canvasMetrics';
import ResizeService from '../services/ResizeService';
import Lang from '../services/LanguageService';
import Sound from '../services/SoundService';

const log = new Logger('Play');
let fpsTimer = 0;
let frames = 0;

export default function makePlay(ctx: CanvasRenderingContext2D) {
  const bubbles = new BubbleManager(ctx.canvas);
  const bubbleRenderer = new BubbleRenderer();
  const backgroundRenderer = new BackgroundRenderer();

  let ready = false;

  const handleResize = () => bubbles.handleResize();
  const input = new PointerInput(ctx.canvas, bubbles);

  return {
    update(dt: number) {
      if (!ready) return; // skip the frame until we’re loaded
      applyDprTransform(ctx);
      const { w: cssW, h: cssH } = cssSize(ctx.canvas);
      const rawDt = dt; // keep the real frame time for diagnostics
      dt = Math.min(rawDt, 0.1); // physics clamp

      // === FPS log ============================
      fpsTimer += rawDt; // use the true elapsed time
      frames++;
      if (fpsTimer >= 1) {
        const fps = Math.round(frames / fpsTimer);
        if (Logger.isDebug) {
          log.debug('fps', fps);
        }
        fpsTimer = 0;
        frames = 0;
      }

      bubbles.update(dt);

      backgroundRenderer.update(dt);

      backgroundRenderer.draw(ctx);

      bubbles.entities.forEach((b) => bubbleRenderer.render(ctx, b, cssW, cssH));
    },
    async enter() {
      log.info('Play screen entered');

      // Load language data first to ensure Lang.symbols is populated.
      await Lang.load('ja');

      // Then, kick off audio pre-cache, but **don’t await**
      Sound.preloadAll(Lang.symbols.map((s) => `${Lang.currentCode}/${s.audio}`)).catch((err) =>
        log.warn('audio preload', err),
      );

      ready = true; // start the game immediately
      ResizeService.subscribe(handleResize);
      // Call handleResize once initially to set correct scaling if canvas size differs from prevW/prevH defaults
      handleResize();
      input.attach();
    },
    exit() {
      log.info('Play screen exited');
      ResizeService.unsubscribe(handleResize);
      input.detach();
      bubbles.clear();
    },
  };
}
