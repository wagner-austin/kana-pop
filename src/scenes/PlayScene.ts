import BaseScene from './BaseScene';

import BubbleManager from '@/managers/BubbleManager';
import BubbleRenderer from '@/renderers/BubbleRenderer';
import IndicatorBubble from '@/entities/IndicatorBubble';
import type Bubble from '@/entities/Bubble';
import PointerInput from '@/input/PointerInput';
import { cssSize, applyDprTransform } from '@/utils/canvasMetrics';
import Lang from '@/services/LanguageService';
import {
  themeColours,
  BUBBLE_SIZE_RATIO,
  MAX_DIFFICULTY,
  STREAK_FOR_LEVEL_UP,
} from '@/config/constants';
import Sound from '@/services/SoundService';
import StreakCounter from '@/ui/StreakCounter';

export default class PlayScene extends BaseScene {
  private bubbles = new BubbleManager(this.ctx.canvas);
  private renderer = new BubbleRenderer();
  private indicator: IndicatorBubble | null = null;
  private streak = 0;
  private difficulty = 1;
  private streakUI = new StreakCounter();

  /** Called by PointerInput for every successful bubble hit */
  private onBubbleTap = (b: Bubble): void => {
    if (!this.indicator) return;

    // If the indicator itself was tapped, just let its own logic handle (squish/flip)
    if (b === this.indicator) return;

    if (b.romaji === this.indicator.romaji) {
      /* ✔ correct */
      this.streak++;
      this.updateDifficulty();
      this.streakUI.set(this.streak);
      Sound.playPop();
      this.spawnIndicator();
    } else {
      /* ✖ incorrect */
      this.streak = 0;
      this.updateDifficulty();
      this.streakUI.set(this.streak);
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
    this.streakUI.mount();
  }

  override update(dt: number) {
    const { w, h } = cssSize(this.ctx.canvas);
    this.ctx.clearRect(0, 0, w, h);
    applyDprTransform(this.ctx);
    this.bubbles.update(dt);

    // Ensure at least one correct bubble remains on-screen
    if (this.indicator) {
      const targetRomaji = this.indicator.romaji;
      if (!this.bubbles.entities.some((b) => b.romaji === targetRomaji)) {
        const sym = Lang.symbols?.find((s) => s.roman === targetRomaji);
        if (sym) this.bubbles.guarantee(sym);
      }
    }

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
    this.streakUI.unmount();
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

    // Immediately spawn at least one matching gameplay bubble
    this.bubbles.guarantee(sym);

    // Play the romaji audio when indicator appears
    Sound.playRoman(sym.roman);

    // ensure UI streak starts at current value (0 on game start)
    this.streakUI.set(this.streak);
  }

  /* ---------------- difficulty helper ---------------- */
  private updateDifficulty() {
    // Linear interpolation: every correct answer nudges difficulty upward a bit
    // Full +1 tier after STREAK_FOR_LEVEL_UP correct taps
    this.difficulty = Math.min(1 + this.streak / STREAK_FOR_LEVEL_UP, MAX_DIFFICULTY);
    this.bubbles.setDifficulty(this.difficulty);
  }
}
