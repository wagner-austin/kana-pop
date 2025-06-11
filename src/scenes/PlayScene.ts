import BaseScene from './BaseScene';

import BubbleManager from '@/managers/BubbleManager';
import BubbleRenderer from '@/renderers/BubbleRenderer';
import IndicatorBubble from '@/entities/IndicatorBubble';
import type Bubble from '@/entities/Bubble';
import PointerInput from '@/input/PointerInput';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';
import Lang from '@/services/LanguageService';
import { themeColours, BUBBLE_SIZE_RATIO } from '@/config/constants';
import Sound from '@/services/SoundService';

export default class PlayScene extends BaseScene {
  private bubbles = new BubbleManager(this.ctx.canvas);
  private renderer = new BubbleRenderer();
  private indicator: IndicatorBubble | null = null;

  /** Called by PointerInput for every successful bubble hit */
  private onBubbleTap = (b: Bubble): void => {
    if (!this.indicator) return;

    // If the indicator itself was tapped, just let its own logic handle (squish/flip)
    if (b === this.indicator) return;

    if (b.romaji === this.indicator.romaji) {
      // ✔ correct – pick a new target
      Sound.playPop(); // audible feedback
      this.spawnIndicator();
    } else {
      // ✖ incorrect – brief red flash on indicator
      this.indicator.flashTimer = 0.15;
    }
  };

  private input = new PointerInput(
    this.ctx.canvas,
    this.bubbles,
    this.onBubbleTap,
    () => this.indicator,
  );

  override async enter() {
    await super.enter();
    this.bubbles.handleResize();
    this.spawnIndicator();
    this.input.attach();
  }

  override update(dt: number) {
    const { w, h } = cssSize(this.ctx.canvas);
    this.ctx.clearRect(0, 0, w, h);
    applyDprTransform(this.ctx);
    this.bubbles.update(dt);

    /* Update indicator but render it AFTER gameplay bubbles for top Z */
    if (this.indicator) {
      this.indicator.step(dt);
    }

    // Render gameplay bubbles first
    this.bubbles.entities.forEach((b) => this.renderer.render(this.ctx, b, w, h));

    // Render indicator on top
    if (this.indicator) {
      this.renderer.render(this.ctx, this.indicator, w, h);
    }
  }

  override exit() {
    this.input.detach();
    this.bubbles.clear();
    this.indicator = null;
    super.exit();
  }

  protected paint() {
    /* PlayScene is real-time → no static paint */
  }

  // ─────────────────────────────────────────────────────────────
  /** Pick a new romaji target and (re)create the indicator bubble */
  private spawnIndicator() {
    if (!Lang.symbols || !Lang.symbols.length) return;

    const { w, h } = cssSize(this.ctx.canvas);

    const sym = Lang.symbols[Math.floor(Math.random() * Lang.symbols.length)]!;
    const rPx = Math.min(w, h) * BUBBLE_SIZE_RATIO; // same rule as game bubbles
    const palette = themeColours();
    const colour = palette[Math.floor(Math.random() * palette.length)] ?? '#FFD1DC';

    // Random kana glyph for reference bubble
    const glyph = Lang.randomGlyph(sym);

    // Position slightly below top so rim visible even on notched phones
    const yNorm = rPx / h + 0.02;
    this.indicator = new IndicatorBubble(0.5, yNorm, colour, glyph, sym.roman, rPx);

    // Play the romaji audio when indicator appears
    Sound.playRoman(sym.roman);
  }
}
