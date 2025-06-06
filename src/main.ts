import ResizeService from './services/ResizeService';
import BackgroundManager from './core/BackgroundManager';
import StateMachine from './core/StateMachine';
import HomeScene from './scenes/HomeScene';
import PlayScene from './scenes/PlayScene';
import Theme from './services/ThemeService';
import Loader from './services/AssetLoader';
import Storage from './utils/StorageService';
import Sound from './services/SoundService';

let sm: StateMachine | null = null;
let bg: BackgroundManager | null = null;

// Get canvas references first but don't start rendering yet
const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('#game canvas not found');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2-D context not available');

// Create background canvas but don't start rendering yet
const bgCanvas = document.createElement('canvas');
bgCanvas.id = 'bg';
document.body.prepend(bgCanvas);

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

(async () => {
  // Load all resources and initialize everything before starting any rendering
  /* 1 - theme first */
  const themePath = Storage.get('kanaPop.theme') ?? 'assets/themes/pastel-pond/';
  await Theme.load(themePath);

  /* 2 - initialize scenes */
  sm = new StateMachine();
  sm.add('home', new HomeScene(sm, ctx)).add('play', new PlayScene(sm, ctx));

  /* 3 - initialize background manager ONLY after theme is loaded */
  bg = new BackgroundManager(bgCanvas);

  /* 4 - change to home scene */
  await sm.change('home'); // draw “Tap to Start” immediately

  /* 5 - kick off (non-blocking) asset load */
  Loader.run(() => {}).catch(console.error); // no visual progress bar

  /* 6 - NOW start the game loop - everything is ready */
  last = performance.now();
  raf = requestAnimationFrame(loop);
})();

let raf = 0;
let last = performance.now();
function loop(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  bg?.paint(dt); // ① draw background first
  sm?.update(dt); // ② active scene paints on #game canvas
  raf = requestAnimationFrame(loop);
}

// Suspend when page is hidden (saves battery on iOS)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
});

document.addEventListener('scenechange', (e) => {
  const { nextScene } = (e as CustomEvent).detail;
  if (sm) {
    sm.change(nextScene);
  }
  last = performance.now(); // reset last to avoid a giant dt
  raf = requestAnimationFrame(loop);
});
