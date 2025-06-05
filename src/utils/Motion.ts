// src/utils/Motion.ts
export type MotionSample = { x: number; y: number };

export interface MotionProvider {
  /** Start sampling and invoke cb every RAF with normalised values in –1..1 */
  start(cb: (v: MotionSample) => void): Promise<void> | void; // GyroProvider.start is async
  stop(): void;
}

import { IS_DEV, GYRO_INIT_GRACE_PERIOD_MS, DEBUG_ELEMENT_ID_PREFIX } from '@/config/constants';

export class GyroProvider implements MotionProvider {
  private active = false;
  private lastUpdate = 0;
  private hadMotionData = false;
  private debugElement: HTMLElement | null = null;
  private startedAt = 0; // Added for isActive grace period
  private listener = (e: DeviceOrientationEvent) => {
    // γ ≈ left-right tilt, β ≈ front-back; normalise to –1..1
    const gamma = e.gamma ?? 0;
    const beta = e.beta ?? 0;

    if (gamma !== 0 || beta !== 0) {
      this.hadMotionData = true;
    }

    const x = gamma / 45; // 45° gives full offset
    const y = beta / 45;

    this.cb?.({ x: clamp(x), y: clamp(y) });

    // Debug information update - limit to once every 500ms
    const now = Date.now();
    if (this.debugElement && now - this.lastUpdate > 500) {
      this.debugElement.textContent = `Motion: γ=${gamma.toFixed(1)}° β=${beta.toFixed(1)}° (${x.toFixed(2)}, ${y.toFixed(2)})`;
      this.lastUpdate = now;
    }
  };
  private cb?: (v: MotionSample) => void;

  async start(cb: (v: MotionSample) => void): Promise<void> {
    // Explicitly async
    if (this.active) return;
    this.cb = cb;

    // Create debug element if in dev mode
    if (IS_DEV) {
      this.createDebugElement();
    }

    // iOS 13+ requires an explicit promise-based permission
    // The requestPermission method is a static method on the DeviceOrientationEvent constructor
    const DOREventConstructor = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    try {
      // iOS specific permission request
      if (DOREventConstructor && typeof DOREventConstructor.requestPermission === 'function') {
        try {
          const state = await DOREventConstructor.requestPermission();
          if (state !== 'granted') {
            console.warn('DeviceOrientationEvent permission denied by user.');
            this.updateDebugStatus('Permission denied');
            return;
          }
          this.updateDebugStatus('Permission granted, initializing...');
        } catch (error) {
          console.warn('Error requesting DeviceOrientationEvent permission:', error);
          this.updateDebugStatus(`Permission error: ${error}`);
          return;
        }
      }

      // For non-iOS browsers, older iOS, or if permission was already granted/not needed
      window.addEventListener('deviceorientation', this.listener, true);
      this.active = true;
      this.startedAt = Date.now(); // Initialize startedAt

      // Check if we actually get any motion data after a short delay
      setTimeout(() => {
        if (this.active && !this.hadMotionData) {
          console.warn('No motion data received after activation');
          this.updateDebugStatus('No motion data received');
        } else if (this.active) {
          this.updateDebugStatus('Motion active');
        }
      }, GYRO_INIT_GRACE_PERIOD_MS); // Use constant for timeout
    } catch (error) {
      console.error('Unexpected error in motion initialization:', error);
      this.updateDebugStatus(`Init error: ${error}`);
      return;
    }
  }

  stop() {
    if (!this.active) return;
    window.removeEventListener('deviceorientation', this.listener, true);
    this.active = false;
    this.cb = undefined;

    if (this.debugElement && this.debugElement.parentNode) {
      this.debugElement.parentNode.removeChild(this.debugElement);
      this.debugElement = null;
    }
  }

  // Helper to check if provider is active (e.g., after attempting to start)
  isActive(): boolean {
    // allow GYRO_INIT_GRACE_PERIOD_MS grace for first sensor reading
    return (
      this.active && (this.hadMotionData || Date.now() - this.startedAt < GYRO_INIT_GRACE_PERIOD_MS)
    );
  }

  private createDebugElement() {
    if (typeof document === 'undefined') return;

    const elementId = `${DEBUG_ELEMENT_ID_PREFIX}Motion`;
    document.getElementById(elementId)?.remove(); // HMR cleanup

    this.debugElement = document.createElement('div');
    this.debugElement.id = elementId; // Set ID for HMR cleanup
    this.debugElement.style.position = 'fixed';
    this.debugElement.style.bottom = '10px';
    this.debugElement.style.left = '10px';
    this.debugElement.style.background = 'rgba(0,0,0,0.5)';
    this.debugElement.style.color = 'white';
    this.debugElement.style.padding = '5px';
    this.debugElement.style.fontSize = '12px';
    this.debugElement.style.zIndex = '9999';
    this.debugElement.style.pointerEvents = 'none';
    this.debugElement.textContent = 'Motion: Initializing...';
    document.body.appendChild(this.debugElement);
  }

  private updateDebugStatus(message: string) {
    if (this.debugElement) {
      this.debugElement.textContent = `Motion: ${message}`;
    }
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
