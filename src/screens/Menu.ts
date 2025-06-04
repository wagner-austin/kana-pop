import StateMachine from '../core/StateMachine';
import { BACKGROUND_COLOUR } from '../constants';
import ResizeService from '../services/ResizeService';

export default function makeMenu(sm: StateMachine,
                                 ctx: CanvasRenderingContext2D) {
  const click = () => sm.change('play');

  function paint() {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = BACKGROUND_COLOUR;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#222';                 // dark text
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Tap to Start', width / 2, height / 2);
  }

  return {
    enter() {
      ResizeService.subscribe(paint);
      ctx.canvas.addEventListener('pointerdown', click);
    },
    update() {},
    exit() {
      ResizeService.unsubscribe(paint);
      ctx.canvas.removeEventListener('pointerdown', click);
    }
  };
}
