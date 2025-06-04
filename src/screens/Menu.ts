import StateMachine from '../core/StateMachine.js';
import { BACKGROUND_COLOUR } from '../constants.js';

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
      paint();
      ctx.canvas.addEventListener('pointerdown', click);
      window.addEventListener('resize', paint);   // keep centred
    },
    update() {},
    exit() {
      ctx.canvas.removeEventListener('pointerdown', click);
      window.removeEventListener('resize', paint);
    }
  };
}
