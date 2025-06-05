import ResizeService from './services/ResizeService';
import BackgroundManager from './core/BackgroundManager';
import StateMachine from './core/StateMachine';
import makeMenu from './screens/Menu';
import makePlay from './screens/Play';
import makeSettings from './screens/Settings';
import makeLoading from './screens/Loading';
import Sound from './services/SoundService';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

/* -------- background layer (one per app) -------------------------- */
const bgCanvas = document.createElement('canvas');
bgCanvas.id = 'bg';
document.body.prepend(bgCanvas);
const bg = new BackgroundManager(bgCanvas);
if (!canvas) throw new Error('#game canvas not found');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2-D context not available');

/* ------------------------------------------------------------------
 *  Polyfill: keep CSS var --app-height equal to window.innerHeight.
 *  Needed for older mobile browsers that mis-report 100vh.
 * -----------------------------------------------------------------*/
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', setAppHeight, { once: true });
} else setAppHeight();
window.addEventListener('resize', setAppHeight); // orientationchange → resize

// Attach immediately, so the *very first* tap counts
Sound.armFirstGesture(window);
ResizeService.watchCanvas(canvas);

const sm = new StateMachine();
sm.add('loading', makeLoading('menu', sm, ctx))
  .add('menu', makeMenu(sm, ctx))
  .add('settings', makeSettings(sm, ctx))
  .add('play', makePlay(ctx));
/* start at the loader */
sm.change('loading');

let raf = 0;
let last = performance.now();
function loop(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  bg.paint(dt); // ① draw background first
  sm.update(dt); // ② active scene paints on #game canvas(loop);
  raf = requestAnimationFrame(loop);
}
raf = requestAnimationFrame(loop);

// Suspend when page is hidden (saves battery on iOS)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
});
