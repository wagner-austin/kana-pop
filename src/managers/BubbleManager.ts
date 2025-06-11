import Bubble from '../entities/Bubble';
import { bubbleRadius } from '../utils/bubble';
import {
  themeColours,
  SPAWN_INTERVAL,
  SPEED_DIFFICULTY_CAP,
  MAX_BUBBLES_PER_SPAWN,
  BUBBLE_SPEED_VARIANCE,
  ROMAJI_SPAWN_PROB,
  BUBBLE_DIRECTION,
} from '../config/constants';
import Lang from '../services/LanguageService';
import Logger from '../utils/Logger';
import { cssSize } from '../utils/canvasMetrics';

import type { SymbolDef } from '@/types/language';

const log = new Logger('BubbleMgr');

const randInt = (max: number) => Math.floor(Math.random() * max);
const randColour = (): string => {
  // Get colors from the theme system
  const colours = themeColours();

  // Make sure we have at least one color
  if (colours.length === 0) {
    return '#FFD1DC'; // Default color if somehow no theme colors are available
  }

  // Select a random color from the palette
  const randomIndex = randInt(colours.length);
  // Provide a fallback in case the random index is out of bounds
  return colours[randomIndex] ?? colours[0] ?? '#FFD1DC';
};

export default class BubbleManager {
  private bubbles: Bubble[] = [];
  private spawnTimer = 0;
  private rPx = 0;
  private difficulty = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const { w, h } = cssSize(canvas);
    this.rPx = bubbleRadius(w, h);
  }

  get entities(): readonly Bubble[] {
    return this.bubbles;
  }

  /** Scene pushes the difficulty multiplier (1 = normal). */
  setDifficulty(mult: number) {
    const oldSpeedMult = Math.min(this.difficulty, SPEED_DIFFICULTY_CAP);
    const newSpeedMult = Math.min(mult, SPEED_DIFFICULTY_CAP);
    const ratio = newSpeedMult / oldSpeedMult;
    // Update difficulty first so spawn() uses latest value
    this.difficulty = mult;
    // Scale existing bubble speeds to preserve their random variance proportionally
    this.bubbles.forEach((b) => (b.speed *= ratio));
  }

  update(dt: number) {
    this.spawnTimer -= dt;
    // Keep spawning while timer laps negative to catch up even on big frame delays
    while (this.spawnTimer <= 0) {
      // Determine how many bubbles to create this tick
      const batch = Math.min(1 + Math.floor(this.difficulty), MAX_BUBBLES_PER_SPAWN);
      for (let i = 0; i < batch; i++) {
        this.spawn();
      }
      this.spawnTimer += SPAWN_INTERVAL / this.difficulty; // more spawns as difficulty rises
    }
    this.bubbles.forEach((b) => b.step(dt));
    if (this.bubbles.some((b) => !b.active)) {
      this.bubbles = this.bubbles.filter((b) => b.active);
    }
  }

  handleResize() {
    const { w, h } = cssSize(this.canvas);
    this.rPx = bubbleRadius(w, h);
    this.bubbles.forEach((b) => (b.r = this.rPx));
  }

  hitTest(px: number, py: number) {
    const { w, h } = cssSize(this.canvas);
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b && b.contains(px, py, w, h)) return b;
    }
    return undefined;
  }

  clear() {
    this.bubbles = [];
  }

  // ────────────────────────────────────────────────────────────
  /**
   * Internal spawn helper.
   * If `symbol` is provided, that specific symbol is used; otherwise a random one.
   */
  private spawn(symbol?: SymbolDef) {
    if (!Lang.symbols?.length) return;
    const sym = symbol ?? Lang.symbols[randInt(Lang.symbols.length)]!;
    const glyph = Lang.randomGlyph(sym);

    const { w } = cssSize(this.canvas);
    const rNorm = this.rPx / w;
    const x = rNorm + Math.random() * (1 - 2 * rNorm);
    const y = BUBBLE_DIRECTION === 'up' ? 1 + rNorm : -rNorm;

    const bubble = new Bubble(x, y, randColour(), glyph, sym.roman, this.rPx);
    const speedMult = Math.min(this.difficulty, SPEED_DIFFICULTY_CAP);
    const variance = 1 + (Math.random() * 2 - 1) * BUBBLE_SPEED_VARIANCE; // 0.7–1.3 when variance=0.3
    bubble.speed *= speedMult * variance; // capped speed scaling with variance

    // Randomly start some bubbles showing romaji side first
    if (Math.random() < ROMAJI_SPAWN_PROB) {
      bubble.showingRomaji = true;
    }
    this.bubbles.push(bubble);
    log.debug('spawn', { total: this.bubbles.length, roman: sym.roman });
  }

  /** Public helper to force-spawn at least one matching bubble for the given symbol */
  guarantee(sym: SymbolDef) {
    this.spawn(sym);
  }
}
