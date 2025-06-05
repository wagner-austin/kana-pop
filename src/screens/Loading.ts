import type StateMachine from '@/core/StateMachine';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';
import Loader from '@/services/AssetLoader';
import Theme from '@/services/ThemeService';
import StorageService from '@/services/StorageService';

export default function makeLoading(next: string, sm: StateMachine, ctx: CanvasRenderingContext2D) {
  let progress = 0; // 0‥1

  async function preload(): Promise<void> {
    /* Load the user’s saved theme (or default) so every scene has it */
    const themePath = StorageService.get('kanaPop.theme') ?? 'assets/themes/pastel-pond/';
    await Theme.load(themePath);

    await Loader.run((p) => {
      progress = p;
    });
  }

  return {
    async enter() {
      document.body.dataset.scene = 'loading';
      progress = 0;
      await preload();
      await sm.change(next);
    },
    exit() {
      delete document.body.dataset.scene;
    },
    update() {
      const { w, h } = cssSize(ctx.canvas);
      ctx.clearRect(0, 0, w, h);
      applyDprTransform(ctx); // scale for DPR

      ctx.fillStyle = '#88e';
      ctx.fillRect(w * 0.1, h * 0.45, w * 0.8 * progress, 20);
    },
  };
}
