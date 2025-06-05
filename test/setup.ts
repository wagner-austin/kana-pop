// test/setup.ts
import { vi } from 'vitest';

// 1️⃣ Expose a Jest-compatible global *synchronously*
(globalThis as any).jest = vi;

// 2️⃣ Load the canvas polyfill *after* the global is ready.
//    Vitest allows top-level await, so this happens in sequence.
await import('jest-canvas-mock');

import '@testing-library/jest-dom/vitest';

// Import StorageService to initialize its in-memory fallback for tests
import '@/utils/StorageService';

// ---- helpers for your own code ----------------------------
Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

// Add Web Audio API stubs for environments without AudioContext
if (!('AudioContext' in globalThis)) {
  class AudioContextStub {
    state: AudioContextState = 'running';
    currentTime: number = 0;
    sampleRate: number = 44100;
    destination = { maxChannelCount: 2 };

    resume() {
      this.state = 'running';
      return Promise.resolve();
    }

    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        disconnect: () => {},
        start: () => {},
        stop: () => {},
        onended: null,
      };
    }

    createGain() {
      return {
        gain: { value: 1 },
        connect: () => {},
        disconnect: () => {},
      };
    }

    createBuffer(channels: number, length: number, sampleRate: number) {
      return { duration: length / sampleRate };
    }

    decodeAudioData() {
      return Promise.resolve({});
    }
  }

  (globalThis as any).AudioContext = AudioContextStub;
}

window.matchMedia = (q: string) =>
  ({ media: q, matches: false, addEventListener() {}, removeEventListener() {} }) as any;

if (!('PointerEvent' in globalThis)) (globalThis as any).PointerEvent = MouseEvent;

// Add shims for HapticService and GyroProvider tests
Object.defineProperty(globalThis.navigator, 'vibrate', { value: () => true, configurable: true });
(globalThis as any).DeviceOrientationEvent = function DeviceOrientationEventShim() {};
