import ResizeService from './services/ResizeService';
import BackgroundManager from './core/BackgroundManager';
import StateMachine from './core/StateMachine';
import HomeScene from './scenes/HomeScene';
import PlayScene from './scenes/PlayScene';
import Theme from './services/ThemeService';
import Loader from './services/AssetLoader';
import Storage from './utils/StorageService';
import Sound from './services/SoundService';

/*───────────────────────────────────────────────────────────────────────────
  Dockable debug console.
  Invoke with …/kana-pop/?debug
────────────────────────────────────────────────────────────────────────────*/
if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
  /* ── root elements ───────────────────────────── */
  const toggle = document.createElement('button');
  const pane = document.createElement('pre');

  /* button – always visible, minimal footprint */
  toggle.textContent = '🚦';
  toggle.title = 'Show / hide debug console';
  toggle.style.cssText =
    'position:fixed;bottom:16px;left:16px;width:44px;height:44px;' +
    'z-index:99998;font-size:24px;background:#000C;color:#0F0;border-radius:22px;' +
    'border:1px solid #0F0;cursor:pointer;user-select:none';

  /* log pane – hidden until first click */
  pane.style.cssText =
    'position:fixed;bottom:72px;left:16px;max-width:90vw;max-height:70vh;' +
    'width:60vw;height:40vh;resize:both;' +
    'z-index:99999;background:#000C;color:#0F0;margin:0;padding:0;' +
    'font:12px/1.4 monospace;overflow:auto;white-space:pre-wrap;box-sizing:border-box;' +
    'display:none;border:1px solid #0F0;border-radius:4px;';

  /* header */
  const header = document.createElement('div');
  header.style.cssText =
    'position:sticky;top:0;left:0;right:0;height:20px;background:#030;' +
    'color:#9f9;padding:2px 6px;font-weight:bold;cursor:move;border-bottom:1px solid #0F0;user-select:none;' +
    'touch-action:none';
  header.textContent = 'Debug log';
  pane.append(header);

  /* log area */
  const logArea = document.createElement('span');
  logArea.textContent = '🚦 kana-pop live debug console (first error wins)\n\n';
  pane.append(logArea);

  /* drag handle (overlay header) */
  let dragX = 0,
    dragY = 0,
    down = false,
    moved = false;
  const stopDrag = () => {
    down = false;
  };
  header.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    down = true;
    moved = false;
    dragX = e.clientX - pane.offsetLeft;
    dragY = e.clientY - pane.offsetTop;
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', (e) => {
    e.stopPropagation();
    if (!down) return;
    moved = true;
    pane.style.left = `${e.clientX - dragX}px`;
    pane.style.bottom = 'auto';
    pane.style.top = `${e.clientY - dragY}px`;
  });
  header.addEventListener('pointerup', (e) => {
    stopDrag();
    // Treat a tap (no movement) as a verbosity toggle for mobile users
    if (!moved) {
      verbose = !verbose;
      updateHeader();
      e.stopPropagation();
      e.preventDefault();
    }
  });
  header.addEventListener('pointercancel', stopDrag);

  document.addEventListener(
    'DOMContentLoaded',
    () => {
      document.body.append(toggle, pane);
    },
    { once: true },
  );

  /* filtering */
  let verbose = false;
  const whitelist = [
    'Bubble',
    'Indicator',
    'Streak',
    'Level',
    'Pointer', // input handler
    'spawn', // bubble spawns
    'Tap', // pointer taps
    'correct',
    'wrong',
    'miss',
    'SM', // state-machine transitions
    'BubbleMgr',
  ];
  const updateHeader = () => {
    header.textContent = verbose ? 'Debug log - ALL' : 'Debug log - GAMEPLAY';
  };
  updateHeader();

  /* toggle visibility and verbosity */
  toggle.addEventListener('click', (e) => {
    if (e.shiftKey) {
      verbose = !verbose;
      updateHeader();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    pane.style.display = pane.style.display === 'none' ? 'block' : 'none';
  });

  /* prevent pointerdown */
  toggle.addEventListener('pointerdown', (e) => e.stopPropagation());
  pane.addEventListener('pointerdown', (e) => e.stopPropagation());

  /* log helper */
  const writeLine = (line: string) => {
    logArea.textContent += line + '\n';
    pane.scrollTop = pane.scrollHeight;
  };
  const dump = (label: string, e: unknown) => {
    const msg =
      e instanceof Error && e.stack
        ? e.stack
        : typeof e === 'string'
          ? e
          : JSON.stringify(e, null, 2);
    writeLine(`🛑 ${label}: ${msg}`);
    pane.style.display = 'block'; // auto-open on first error
  };

  /* wire error listeners */
  window.addEventListener('error', (ev) =>
    dump('error', (ev as ErrorEvent).error ?? (ev as ErrorEvent).message),
  );
  window.addEventListener('unhandledrejection', (ev) =>
    dump('promise', (ev as PromiseRejectionEvent).reason),
  );

  /* intercept console output */
  /* eslint-disable no-console */
  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    const orig = console[level];
    console[level] = (...args: unknown[]) => {
      orig.apply(console, args as []);
      const flat = args
        .map((a) => {
          if (typeof a !== 'string') {
            return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
          }

          // Strip console %c tokens while retaining readable text.
          let s = a.startsWith('%c') ? a.replace(/%c/g, '') : a;

          // Skip pure style strings (they usually accompany %c).
          if (/^(?:color|background|font|padding|border)/i.test(s.trim())) {
            return null;
          }
          return s.trim();
        })
        .filter(Boolean) as string[];
      if (flat.length === 0) return; // no meaningful text
      const joined = flat.join(' ');
      const shouldShow = verbose || whitelist.some((tag) => joined.includes(tag));
      if (!shouldShow) return;
      const prefix = level === 'error' ? '🛑' : level === 'warn' ? '⚠️' : '🔹';
      writeLine(`${prefix} ${joined}`);
    };
  });
  /* eslint-enable no-console */
}

/*───────────────────────────────────────────────────────────────────────────
  DEV-only helpers: quick way to see console without staging a real failure
────────────────────────────────────────────────────────────────────────────*/
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(
    `%c[dev] debug overlay 👉  ${location.origin}${import.meta.env.BASE_URL}?debug`,
    'color:#0f0',
  );
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.code === 'KeyE') {
      throw new Error('💥 test error (Alt+Shift+E)');
    }
  });
}

let sm: StateMachine | null = null;
let bg: BackgroundManager | null = null;
let raf = 0;
let last = performance.now();

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
