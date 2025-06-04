import ResizeService from './services/ResizeService';
import StateMachine from './core/StateMachine';
import makeMenu from './screens/Menu';
import makePlay from './screens/Play';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
ResizeService.watchCanvas(canvas);

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
