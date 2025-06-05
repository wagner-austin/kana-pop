import type { IBackgroundEffect } from './IBackgroundEffect';

import Logger from '@/utils/Logger';

const log = new Logger('ShaderEffect');

/**
 * Represents a shader-based background effect.
 * The actual rendering logic for shaders would be complex and is stubbed out here.
 */
export class ShaderEffect implements IBackgroundEffect {
  private shaderConfig: string;
  private container: HTMLElement | null = null;

  constructor(shaderConfig: string) {
    this.shaderConfig = shaderConfig;
    log.debug(`ShaderEffect created with config: ${this.shaderConfig}`);
  }

  mount(container: HTMLElement): void {
    this.container = container;
    // In a real implementation, this would initialize and render the shader.
    // For example, setting up a canvas, WebGL context, compiling shaders, and drawing.
    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.backgroundColor = 'rgba(50, 0, 50, 0.8)'; // Placeholder visual
    el.textContent = `Shader Effect: ${this.shaderConfig}`;
    el.style.color = 'white';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    this.container.appendChild(el);
    log.debug('ShaderEffect mounted. Config:', this.shaderConfig);
  }

  unmount(): void {
    if (this.container) {
      // Remove any elements created by mount
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
      log.debug('ShaderEffect unmounted.');
    }
    this.container = null;
  }

  // IBackgroundEffect ──────────────────────────────
  resize(_width: number, _height: number, _dpr: number): void {
    /* The shader renders directly to the canvas, so
       there’s nothing to recalc – but the method must exist. */
    log.debug(`ShaderEffect resize called: ${_width}x${_height} @ ${_dpr}x`);
  }

  update(_dt: number, _ctx: CanvasRenderingContext2D): boolean {
    // In a real implementation, this would handle shader updates and might return true if it animated.
    log.debug(`ShaderEffect update called with dt: ${_dt}`);
    return false; // Placeholder: return true if animation happened, false otherwise
  }
}
