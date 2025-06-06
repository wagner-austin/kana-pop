import BaseScene from './BaseScene';

import SimpleSettings from '@/ui/SimpleSettings';
import { TEXT_COLOUR_DARK } from '@/config/constants';
import { cssSize } from '@/utils/canvasMetrics';

export default class HomeScene extends BaseScene {
  private settings = new SimpleSettings(() => {
    /* no-op after close */
  });

  override enter = async () => {
    document.body.dataset.scene = 'home'; // NEW
    await super.enter();
    window.addEventListener('pointerdown', this.onTap);
  };

  override exit = () => {
    window.removeEventListener('pointerdown', this.onTap);
    this.settings.hide();
    delete document.body.dataset.scene; // NEW
    super.exit();
  };

  /* ------------------------------------------------------------------ */
  protected paint() {
    const { w, h } = this.clear();
    this.ctx.fillStyle = TEXT_COLOUR_DARK;
    this.ctx.textAlign = 'center';
    this.ctx.font = '32px sans-serif';
    this.ctx.fillText('Tap to Start', w / 2, h / 2);
    this.ctx.font = '20px sans-serif';
    this.ctx.fillText('⚙︎', w - 30, h - 30);
  }

  /* ------------------------------------------------------------------ */
  private onTap = (e: PointerEvent) => {
    const { w, h } = cssSize(this.ctx.canvas);
    const { offsetX: x, offsetY: y } = e;
    if (x > w - 60 && y > h - 60) this.settings.toggle();
    else this.sm.change('play');
  };
}
