import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';
import Logger from '@/utils/Logger';

export class ImageEffect implements IBackgroundEffect {
  private static log = new Logger('ImageEffect');
  private ready = false;
  private imgHorizontal: HTMLImageElement | null = null;
  private imgVertical: HTMLImageElement | null = null;
  private loadedHorizontal = false;
  private loadedVertical = false;

  constructor(src: string) {
    if (typeof window !== 'undefined') {
      // Extract the base path from the source
      const lastSlashIndex = src.lastIndexOf('/');
      const basePath = lastSlashIndex !== -1 ? src.substring(0, lastSlashIndex + 1) : '';
      const fileName = lastSlashIndex !== -1 ? src.substring(lastSlashIndex + 1) : src;

      // Check if the provided source already specifies horizontal or vertical
      const isHorizontal = fileName.includes('horizontal');
      const isVertical = fileName.includes('vertical');

      // Load horizontal image
      this.imgHorizontal = new Image();
      this.imgHorizontal.onload = () => {
        ImageEffect.log.debug(`Loaded horizontal: ${this.imgHorizontal?.src}`);
        this.loadedHorizontal = true;
        this.updateReadyState();
      };
      this.imgHorizontal.onerror = () => {
        this.loadedHorizontal = false;
        ImageEffect.log.error(`Failed to load horizontal image: ${this.imgHorizontal?.src}`);
        this.updateReadyState();
      };

      // Load vertical image
      this.imgVertical = new Image();
      this.imgVertical.onload = () => {
        ImageEffect.log.debug(`Loaded vertical: ${this.imgVertical?.src}`);
        this.loadedVertical = true;
        this.updateReadyState();
      };
      this.imgVertical.onerror = () => {
        this.loadedVertical = false;
        ImageEffect.log.error(`Failed to load vertical image: ${this.imgVertical?.src}`);
        this.updateReadyState();
      };

      // Set the source URLs based on the input pattern
      if (isHorizontal) {
        // If source already specifies horizontal, derive the vertical path
        this.imgHorizontal.src = this.getAdjustedPath(src);
        this.imgVertical.src = this.getAdjustedPath(src.replace('horizontal', 'vertical'));
      } else if (isVertical) {
        // If source already specifies vertical, derive the horizontal path
        this.imgVertical.src = this.getAdjustedPath(src);
        this.imgHorizontal.src = this.getAdjustedPath(src.replace('vertical', 'horizontal'));
      } else {
        // If no orientation specified, try to load both variations
        const horizontalPath = `${basePath}background_horizontal.png`;
        const verticalPath = `${basePath}background_vertical.png`;

        this.imgHorizontal.src = this.getAdjustedPath(horizontalPath);
        this.imgVertical.src = this.getAdjustedPath(verticalPath);

        ImageEffect.log.debug(
          `Loading from: ${this.imgHorizontal.src} and ${this.imgVertical.src} (basePath: ${basePath})`,
        );
      }

      ImageEffect.log.debug(
        `Loading images from: ${this.imgHorizontal.src} and ${this.imgVertical.src}`,
      );
    } else {
      // In Node.js or other non-browser environments, mark as ready but do nothing.
      // This prevents errors but means the effect won't render.
      this.ready = true;
    }
  }

  resize() {} // nothing to do

  private updateReadyState() {
    // Consider ready if at least one image is loaded successfully
    this.ready = this.loadedHorizontal || this.loadedVertical;
  }

  /**
   * Adjusts paths to work in both local development and GitHub Pages environments
   * @param path The original path to adjust
   * @returns The adjusted path that works in the current environment
   */
  private getAdjustedPath(path: string): string {
    // If the path is already absolute (starts with http:// or https://), return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Check if we're running on GitHub Pages
    const isGitHubPages =
      window.location.hostname === 'wagner-austin.github.io' ||
      window.location.hostname.includes('github.io');

    if (isGitHubPages) {
      // For GitHub Pages, ensure we have the correct base path
      const gitHubPagesBase = '/kana-pop/';

      // If path already starts with the base, return it
      if (path.startsWith(gitHubPagesBase)) {
        return path;
      }

      // If path starts with a slash, append it to the base without the leading slash
      if (path.startsWith('/')) {
        return `${gitHubPagesBase}${path.substring(1)}`;
      }

      // Otherwise, just append the path to the base
      return `${gitHubPagesBase}${path}`;
    }

    // For local development, return the path as is
    return path;
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
      // Landscape/horizontal orientation
      img = this.loadedHorizontal ? this.imgHorizontal : this.imgVertical;
    } else {
      // Portrait/vertical orientation
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
