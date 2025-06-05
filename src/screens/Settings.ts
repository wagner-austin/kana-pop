import type StateMachine from '@/core/StateMachine';
import { cssSize } from '@/utils/canvasMetrics';

export default function makeSettings(sm: StateMachine, ctx: CanvasRenderingContext2D) {
  const close = () => sm.pop();

  function draw() {
    const { w, h } = cssSize(ctx.canvas);
    ctx.clearRect(0, 0, w, h);
    /* translucent overlay – background still visible beneath */
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Settings', w / 2, h * 0.2);
    ctx.font = '18px sans-serif';
    ctx.fillText('Tap anywhere to return', w / 2, h * 0.8);
  }

  return {
    enter: () => {
      document.body.dataset.scene = 'settings';
      ctx.canvas.addEventListener('pointerdown', close);
    },
    update() {
      draw();
    },
    exit: () => {
      delete document.body.dataset.scene;
      ctx.canvas.removeEventListener('pointerdown', close);
    },
  };
}
