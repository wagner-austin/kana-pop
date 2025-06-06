import BaseScene from './BaseScene';

import BubbleManager from '@/managers/BubbleManager';
import BubbleRenderer from '@/renderers/BubbleRenderer';
import PointerInput from '@/input/PointerInput';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';

export default class PlayScene extends BaseScene {
  private bubbles = new BubbleManager(this.ctx.canvas);
  private renderer = new BubbleRenderer();
  private input = new PointerInput(this.ctx.canvas, this.bubbles);

  override async enter() {
    await super.enter();
    this.bubbles.handleResize();
    this.input.attach();
  }

  override update(dt: number) {
    const { w, h } = cssSize(this.ctx.canvas);
    this.ctx.clearRect(0, 0, w, h);
    applyDprTransform(this.ctx);
    this.bubbles.update(dt);
    this.bubbles.entities.forEach((b) => this.renderer.render(this.ctx, b, w, h));
  }

  override exit() {
    this.input.detach();
    this.bubbles.clear();
    super.exit();
  }

  protected paint() {
    /* PlayScene is real-time → no static paint */
  }
}
