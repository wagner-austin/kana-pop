import type { IBackgroundEffect } from './IBackgroundEffect';

export class VideoEffect implements IBackgroundEffect {
  private vid: HTMLVideoElement | null = null;

  constructor(src: string) {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      this.vid = document.createElement('video');
      this.vid.src = src;
      this.vid.autoplay = true;
      this.vid.loop = true;
      this.vid.muted = true; // common for background videos
      this.vid.style.position = 'fixed'; // ensure it's in bg
      this.vid.style.top = '0';
      this.vid.style.left = '0';
      this.vid.style.width = '100%';
      this.vid.style.height = '100%';
      this.vid.style.objectFit = 'cover';
      this.vid.style.zIndex = '-1';
      document.body.appendChild(this.vid);
    } else {
      // In Node.js or other non-browser environments, do nothing.
      // The effect won't render, but this prevents errors.
    }
  }

  resize() {} // video scales with CSS

  update(_delta: number, _ctx: CanvasRenderingContext2D): boolean {
    return false; // <video> paints itself, or does nothing in Node
  }

  dispose() {
    if (this.vid && this.vid.parentNode) {
      this.vid.parentNode.removeChild(this.vid);
      this.vid = null; // Clear reference
    }
  }
}
