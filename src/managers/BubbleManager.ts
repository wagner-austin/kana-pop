import Bubble from '../entities/Bubble';
import { bubbleRadius } from '../utils/bubble';
import { themeColours, SPAWN_INTERVAL } from '../config/constants';
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

  constructor(private readonly canvas: HTMLCanvasElement) {
    const { w, h } = cssSize(canvas);
    this.rPx = bubbleRadius(w, h);
  }

  get entities(): readonly Bubble[] {
    return this.bubbles;
  }

  update(dt: number) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = SPAWN_INTERVAL;
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
    const y = 1 + rNorm;

    this.bubbles.push(new Bubble(x, y, randColour(), glyph, sym.roman, this.rPx));
    log.debug('spawn', { total: this.bubbles.length, roman: sym.roman });
  }

  /** Public helper to force-spawn at least one matching bubble for the given symbol */
  guarantee(sym: SymbolDef) {
    this.spawn(sym);
  }
}
