import Logger from '../utils/Logger';
import { bubbleRadius, AUDIO_COOLDOWN } from '../constants';
import Sound from '../services/SoundService';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  public speed: number = 0.2; // fraction of canvas height per second
  public showingRomaji = false; // ← new
  private lastSpoken = -Infinity; // ← new

  constructor(
    public x: number,
    public y: number,
    public color: string,
    public glyph: string,
    public romaji: string,
  ) {
    log.debug('spawn', { x: this.x.toFixed(2), color, glyph: this.glyph });
  }

  /** Toggle romaji ↔ kana and play the audio, observing cooldown */
  handleClick(nowSec: number) {
    if (nowSec - this.lastSpoken < AUDIO_COOLDOWN) return;
    this.lastSpoken = nowSec;

    this.showingRomaji = !this.showingRomaji;
    Sound.playRoman(this.romaji);
    log.debug('toggle', { romaji: this.showingRomaji });
  }

  step(dt: number) {
    this.y -= this.speed * dt;
    if (this.y < -0.05) this.active = false; // slight overshoot so it’s fully gone
  }

  contains(clickPixelX: number, clickPixelY: number, cssW: number, cssH: number): boolean {
    if (!this.active) return false;

    const bubblePixelX = this.x * cssW;
    const bubblePixelY = this.y * cssH;

    const dx = clickPixelX - bubblePixelX;
    const dy = clickPixelY - bubblePixelY;
    const distanceSquared = dx * dx + dy * dy;

    const r = bubbleRadius(); // Fetch radius at time of check
    return distanceSquared <= r * r;
  }
}
