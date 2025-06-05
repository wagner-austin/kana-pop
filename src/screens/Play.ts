import BubbleManager from '../managers/BubbleManager';
import PointerInput from '../input/PointerInput';
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

  let ready = false;

  const handleResize = () => bubbles.handleResize();
  const input = new PointerInput(ctx.canvas, bubbles);

  return {
    update(dt: number) {
      if (!ready) return; // skip the frame until we’re loaded
      const { w: cssW, h: cssH } = cssSize(ctx.canvas);
      ctx.clearRect(0, 0, cssW, cssH);
      applyDprTransform(ctx);
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

      bubbles.entities.forEach((b) => bubbleRenderer.render(ctx, b, cssW, cssH));
    },
    async enter() {
      document.body.dataset.scene = 'play';
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
      /* background handled globally – no resize hook needed here */
      // Call handleResize once initially to set correct scaling if canvas size differs from prevW/prevH defaults
      handleResize();
      input.attach();
    },
    exit() {
      delete document.body.dataset.scene;
      log.info('Play screen exited');
      ResizeService.unsubscribe(handleResize);
      input.detach();
      bubbles.clear();
      /* stop gyro / fallback RAF to avoid leaks */
      /* no backgroundRenderer anymore */
    },
  };
}
