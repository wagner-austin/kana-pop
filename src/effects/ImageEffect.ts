import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';
import Logger from '@/utils/Logger';

export class ImageEffect implements IBackgroundEffect {
  private static log = new Logger('ImageEffect');
  private ready = false;
  private imgHorizontal: HTMLImageElement | null = null;
  private imgVertical: HTMLImageElement | null = null;
  private loadedHorizontal = false;
  private loadedVertical = false;

  constructor(urls: { horizontal: string; vertical: string }) {
    if (typeof window !== 'undefined') {
      this.imgHorizontal = new Image();
      this.imgHorizontal.onload = () => {
        ImageEffect.log.debug(`Loaded horizontal image: ${this.imgHorizontal?.src}`);
        this.loadedHorizontal = true;
        this.updateReadyState();
      };
      this.imgHorizontal.onerror = () => {
        this.loadedHorizontal = false;
        ImageEffect.log.error(`Failed to load horizontal image: ${this.imgHorizontal?.src}`);
        this.updateReadyState();
      };
      this.imgHorizontal.src = urls.horizontal;

      this.imgVertical = new Image();
      this.imgVertical.onload = () => {
        ImageEffect.log.debug(`Loaded vertical image: ${this.imgVertical?.src}`);
        this.loadedVertical = true;
        this.updateReadyState();
      };
      this.imgVertical.onerror = () => {
        this.loadedVertical = false;
        ImageEffect.log.error(`Failed to load vertical image: ${this.imgVertical?.src}`);
        this.updateReadyState();
      };
      this.imgVertical.src = urls.vertical;
    } else {
      this.ready = true;
    }
  }

  resize() {}
  private updateReadyState() {
    // Ready if at least one is loaded
    this.ready = this.loadedHorizontal || this.loadedVertical;
  }

  update(_delta: number, ctx: CanvasRenderingContext2D): boolean {
    if (!this.ready) {
      return false;
    }

    // Get canvas dimensions - using width/height directly gives us physical pixels
    // This ensures the background doesn't scale with UI scaling
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const aspectRatio = canvasWidth / canvasHeight;

    // Choose the appropriate image based on screen orientation
    let img = null;
    if (aspectRatio >= 1) {
      img = this.loadedHorizontal ? this.imgHorizontal : this.imgVertical;
    } else {
      img = this.loadedVertical ? this.imgVertical : this.imgHorizontal;
    }

    // If neither image is available, return false
    if (!img || !img.complete || img.naturalWidth === 0) {
      return false;
    }

    // Calculate scaling to cover the canvas while maintaining aspect ratio
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth,
      drawHeight,
      offsetX = 0,
      offsetY = 0;

    if (imgAspect > aspectRatio) {
      // Image is wider than canvas (relatively)
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
    } else {
      // Image is taller than canvas (relatively)
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    // Draw the image at a fixed size that doesn't scale with UI
    // Using the physical pixel dimensions of the canvas ensures consistent scaling
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    return true;
  }
}
