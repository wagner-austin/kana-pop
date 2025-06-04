// test/setup.ts
import { vi } from 'vitest';

// 1️⃣ Expose a Jest-compatible global *synchronously*
(globalThis as any).jest = vi;

// 2️⃣ Load the canvas polyfill *after* the global is ready.
//    Vitest allows top-level await, so this happens in sequence.
await import('jest-canvas-mock');

import '@testing-library/jest-dom/vitest';

// ---- helpers for your own code ----------------------------
Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

window.matchMedia = (q: string) =>
  ({ media: q, matches: false, addEventListener() {}, removeEventListener() {} } as any);

if (!('PointerEvent' in globalThis)) (globalThis as any).PointerEvent = MouseEvent;
