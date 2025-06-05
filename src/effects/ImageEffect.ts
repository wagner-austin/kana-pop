import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';
import Logger from '@/utils/Logger';

export class ImageEffect implements IBackgroundEffect {
  private static log = new Logger('ImageEffect');
  private ready = false;
  private img: HTMLImageElement | null = null;

  constructor(src: string) {
    if (typeof window !== 'undefined') {
      this.img = new Image();
      this.img.onload = () => {
        ImageEffect.log.debug(`Loaded: ${src}`);
        this.ready = true;
      };
      this.img.onerror = () => {
        this.ready = false;
        ImageEffect.log.error(`Failed to load image: ${src}`);
        // Fallback logic removed as ThemeService now provides a fully resolved URL.
      };

      ImageEffect.log.debug(`Loading image from: ${src}`);
      this.img.src = src;
    } else {
      // In Node.js or other non-browser environments, mark as ready but do nothing.
      // This prevents errors but means the effect won't render.
      this.ready = true;
    }
  }

  resize() {} // nothing to do

  update(_delta: number, ctx: CanvasRenderingContext2D): boolean {
    if (!this.ready || !this.img || !this.img.complete || this.img.naturalWidth === 0) {
      return false;
    }
    /* Paint at native resolution, anchored top-left – no scaling */
    ctx.drawImage(this.img, 0, 0);
    return true;
  }
}
