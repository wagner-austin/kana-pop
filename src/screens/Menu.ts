import StateMachine from '../core/StateMachine';

export default function makeMenu(sm: StateMachine,
                                 ctx: CanvasRenderingContext2D) {
  function paint() {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = '#C7CEEA';              // pastel background
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#222';                 // dark text
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Tap to Start', width / 2, height / 2);
  }

  return {
    enter() {
      paint();
      ctx.canvas.onclick = () => sm.change('play');
      window.addEventListener('resize', paint);   // keep centred
    },
    update() {},
    exit() {
      ctx.canvas.onclick = null;
      window.removeEventListener('resize', paint);
    }
  };
}
