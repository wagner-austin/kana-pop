import type StateMachine from '../core/StateMachine';
import { backgroundColour, TEXT_COLOUR_DARK } from '../config/constants';
import ResizeService from '../services/ResizeService';
import { applyDprTransform, cssSize } from '../utils/canvasMetrics';

export default function makeMenu(sm: StateMachine, ctx: CanvasRenderingContext2D) {
  function click(e: PointerEvent) {
    const { w, h } = cssSize(ctx.canvas);
    const x = e.offsetX;
    const y = e.offsetY;

    /* bottom-right 60×60px square opens settings */
    if (x > w - 60 && y > h - 60) sm.push('settings');
    else sm.change('play');
  }

  function paint() {
    applyDprTransform(ctx); // Ensure transform is active for every paint
    const { w: width, h: height } = cssSize(ctx.canvas);
    ctx.fillStyle = backgroundColour();
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = TEXT_COLOUR_DARK; // dark text
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Tap to Start', width / 2, height / 2);
    /* small cog */
    ctx.font = '20px sans-serif';
    ctx.fillText('⚙︎', width - 30, height - 30);
  }

  return {
    enter() {
      ResizeService.subscribe(paint);
      ctx.canvas.addEventListener('pointerdown', click);
    },
    update() {
      paint();
    },
    exit() {
      ResizeService.unsubscribe(paint);
      ctx.canvas.removeEventListener('pointerdown', click);
    },
  };
}
