import BubbleManager from '../managers/BubbleManager';
import PointerInput from '../input/PointerInput';
import BackgroundRenderer from '../renderers/BackgroundRenderer';
import BubbleRenderer from '../renderers/BubbleRenderer';
import Logger from '../utils/Logger';
import { cssSize, applyDprTransform } from '../utils/canvasMetrics';
import ResizeService from '../services/ResizeService';
import Lang from '../services/LanguageService';
import Sound from '../services/SoundService';
import StorageService from '../services/StorageService'; // Changed to relative path

import type { SymbolDef } from '@/types/language';
import Theme from '@/services/ThemeService'; // Added

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

  // Named resize handler for the background renderer to allow unsubscribing
  const bgResizeHandler = () => {
    if (!ResizeService) return; // Guard against ResizeService being undefined if called too early/late
    const { cssWidth: w, cssHeight: h, dpr } = ResizeService;
    if (backgroundRenderer) backgroundRenderer.handleResize(w, h, dpr);
  };

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

      backgroundRenderer.draw(dt, ctx);

      const parallax = backgroundRenderer.getOffset();
      bubbles.entities.forEach((b) => bubbleRenderer.render(ctx, b, cssW, cssH, parallax));
    },
    async enter() {
      log.info('Play screen entered');

      /* ① theme ---------------------------------------- */
      await Theme.load(StorageService.get('kanaPop.theme') ?? 'assets/themes/pastel-pond/');
      bubbles.clear();
      bubbles.handleResize(); // Refresh bubble sizes with current canvas dimensions

      /* ② language ------------------------------------- */
      // Load language data first to ensure Lang.symbols is populated.
      await Lang.load('ja');

      // Then, kick off audio pre-cache, but **don’t await**
      Sound.preloadAll(Lang.symbols.map((s: SymbolDef) => `${Lang.currentCode}/${s.audio}`)).catch(
        (err: unknown) => log.warn('audio preload', err),
      );

      ready = true; // start the game immediately
      ResizeService.subscribe(handleResize);
      ResizeService.subscribe(bgResizeHandler);
      // Call handleResize once initially to set correct scaling if canvas size differs from prevW/prevH defaults
      handleResize();
      input.attach();
    },
    exit() {
      log.info('Play screen exited');
      ResizeService.unsubscribe(handleResize);
      ResizeService.unsubscribe(bgResizeHandler); // Unsubscribe background resize handler
      input.detach();
      bubbles.clear();
      /* stop gyro / fallback RAF to avoid leaks */
      backgroundRenderer.dispose();
    },
  };
}
