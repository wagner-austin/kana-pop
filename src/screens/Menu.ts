import StateMachine from '../core/StateMachine';
import { BACKGROUND_COLOUR, TEXT_COLOUR_DARK } from '../constants';
import ResizeService from '../services/ResizeService';
import { applyDprTransform, cssSize } from '../utils/canvasMetrics';

export default function makeMenu(sm: StateMachine, ctx: CanvasRenderingContext2D) {
  const click = () => sm.change('play');

  function paint() {
    applyDprTransform(ctx); // Ensure transform is active for every paint
    const { w: width, h: height } = cssSize(ctx.canvas);
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = TEXT_COLOUR_DARK; // dark text
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Tap to Start', width / 2, height / 2);
  }

  return {
    enter() {
      ResizeService.subscribe(paint);
      ctx.canvas.addEventListener('pointerdown', click);
      ctx.canvas.addEventListener('touchstart', click);
    },
    update() {
      paint();
    },
    exit() {
      ResizeService.unsubscribe(paint);
      ctx.canvas.removeEventListener('pointerdown', click);
      ctx.canvas.removeEventListener('touchstart', click);
    },
  };
}
