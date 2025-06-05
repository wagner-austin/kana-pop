import type { IBackgroundEffect } from '@/effects/IBackgroundEffect';

export class CssEffect implements IBackgroundEffect {
  constructor(private cls: string) {
    document.body.classList.add(cls);
  }
  resize() {}
  update() {
    return false;
  } // Indicates CSS is handling it, no canvas paint needed from JS
  dispose?() {
    document.body.classList.remove(this.cls);
  }
}
