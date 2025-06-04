import resizeCanvas from './utils/resizeCanvas.js';
import StateMachine from './core/StateMachine.js';
import makeMenu from './screens/Menu.js';
import makePlay from './screens/Play.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
resizeCanvas(canvas);
window.addEventListener('resize', () => resizeCanvas(canvas));

const sm = new StateMachine();
sm.add('menu', makeMenu(sm, ctx))
  .add('play', makePlay(ctx));
sm.change('menu');

let last = performance.now();
function loop(now: number) {
  const dt = (now - last) / 1000; last = now;
  sm.update(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
