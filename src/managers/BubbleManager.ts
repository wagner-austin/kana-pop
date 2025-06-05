import Bubble from '../entities/Bubble';
import { bubbleRadius } from '../utils/bubble';
import { themeColours, SPAWN_INTERVAL } from '../config/constants';
import Lang from '../services/LanguageService';
import Logger from '../utils/Logger';
import { cssSize } from '../utils/canvasMetrics';

const log = new Logger('BubbleMgr');

const randInt = (max: number) => Math.floor(Math.random() * max);
const randColour = (): string => {
  const colours = themeColours();
  if (colours.length === 0) {
    return '#ffffff'; // Default color if no theme colors are available
  }
  // randInt(max) returns value from 0 to max-1.
  // So, colours[randInt(colours.length)] should always be a valid string.
  // Add ?? '#ffffff' for robustness, especially if noUncheckedIndexedAccess is on.
  return colours[randInt(colours.length)] ?? '#ffffff';
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
  private spawn() {
    if (!Lang.symbols?.length) return;
    const sym = Lang.symbols[randInt(Lang.symbols.length)]!;
    const glyph = Lang.randomGlyph(sym);

    const { w } = cssSize(this.canvas);
    const rNorm = this.rPx / w;
    const x = rNorm + Math.random() * (1 - 2 * rNorm);
    const y = 1 + rNorm;

    this.bubbles.push(new Bubble(x, y, randColour(), glyph, sym.roman, this.rPx));
    log.debug('spawn', { total: this.bubbles.length, roman: sym.roman });
  }
}
