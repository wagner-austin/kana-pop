import type StateMachine from '@/core/StateMachine';
import { cssSize } from '@/utils/canvasMetrics';
import Loader from '@/services/AssetLoader';

export default function makeLoading(next: string, sm: StateMachine, ctx: CanvasRenderingContext2D) {
  let progress = 0; // 0‥1

  async function preload(): Promise<void> {
    await Loader.run((p) => {
      progress = p;
    });
  }

  return {
    async enter() {
      progress = 0;
      await preload();
      await sm.change(next);
    },
    update() {
      const { w, h } = cssSize(ctx.canvas);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#444';
      ctx.fillRect(w * 0.1, h * 0.45, w * 0.8, 20);

      ctx.fillStyle = '#88e';
      ctx.fillRect(w * 0.1, h * 0.45, w * 0.8 * progress, 20);
    },
  };
}
