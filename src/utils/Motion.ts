// src/utils/Motion.ts
export type MotionSample = { x: number; y: number };

export interface MotionProvider {
  /** Start sampling and invoke cb every RAF with normalised values in –1..1 */
  start(cb: (v: MotionSample) => void): Promise<void> | void; // GyroProvider.start is async
  stop(): void;
}

export class GyroProvider implements MotionProvider {
  private active = false;
  private listener = (e: DeviceOrientationEvent) => {
    // γ ≈ left-right tilt, β ≈ front-back; normalise to –1..1
    const x = (e.gamma ?? 0) / 45; // 45° gives full offset
    const y = (e.beta ?? 0) / 45;
    this.cb?.({ x: clamp(x), y: clamp(y) });
  };
  private cb?: (v: MotionSample) => void;

  async start(cb: (v: MotionSample) => void): Promise<void> {
    // Explicitly async
    if (this.active) return;
    this.cb = cb;

    // iOS 13+ requires an explicit promise-based permission
    // The requestPermission method is a static method on the DeviceOrientationEvent constructor
    const DOREventConstructor = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (DOREventConstructor && typeof DOREventConstructor.requestPermission === 'function') {
      try {
        const state = await DOREventConstructor.requestPermission();
        if (state !== 'granted') {
          console.warn(
            'DeviceOrientationEvent permission denied. Gyro motion will not be available initially from this provider.',
          );
          // The consumer (BackgroundRenderer) will be responsible for potentially falling back
          // by checking if this provider becomes active or provides data.
          return; // Do not proceed if permission is not granted
        }
        // If permission is granted, proceed to add event listener below
      } catch (error) {
        console.warn(
          'Error requesting DeviceOrientationEvent permission or permission denied:',
          error,
        );
        // The consumer (BackgroundRenderer) will be responsible for potentially falling back
        return; // Do not proceed if there was an error or denial
      }
    }
    // For non-iOS browsers, older iOS, or if permission was already granted/not needed,
    // or if permission was granted in the block above.
    window.addEventListener('deviceorientation', this.listener, true);
    this.active = true;
  }

  stop() {
    if (!this.active) return;
    window.removeEventListener('deviceorientation', this.listener, true);
    this.active = false;
    this.cb = undefined; // Clear callback
  }

  // Helper to check if provider is active (e.g., after attempting to start)
  isActive(): boolean {
    return this.active;
  }
}

export class DummyScrollProvider implements MotionProvider {
  private raf = 0;
  private t = 0; // Represents progress through one full sine wave cycle (0 to 1)
  private cb?: (v: MotionSample) => void;

  start(cb: (v: MotionSample) => void): void {
    // Not async
    this.cb = cb;
    const loop = () => {
      this.t += 0.001; // Speed factor: 0.001 for a ~16s cycle at 60fps.
      if (this.t > 1) {
        this.t -= 1;
      }
      this.cb?.({ x: 0, y: Math.sin(this.t * Math.PI * 2) });
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.cb = undefined; // Clear callback
  }
}

export function chooseMotionProvider(): MotionProvider {
  // Prefer GyroProvider if DeviceOrientationEvent is present.
  // The GyroProvider itself handles permission requests.
  // Fallback to DummyScrollProvider will be handled by the BackgroundRenderer
  // if GyroProvider fails to start or grant permission.
  if ('DeviceOrientationEvent' in window) {
    return new GyroProvider();
  }
  return new DummyScrollProvider();
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
