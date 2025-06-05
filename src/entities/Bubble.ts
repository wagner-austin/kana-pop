import Logger from '../utils/Logger';
import {
  AUDIO_COOLDOWN,
  BUBBLE_TAP_SCALE,
  BUBBLE_FLASH_DURATION,
  HAPTIC_DURATION_MS,
} from '../config/constants';
import Sound from '../services/SoundService';
import Haptics from '../services/HapticService';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  public speed = 0.2; // fraction of canvas height per second
  public r: number;
  /** current visual scale (1 == normal size) */
  public scale = 1;

  /** countdown timer for the white rim flash */
  private flashTimer = 0;
  public showingRomaji = false; // ← new
  private lastSpoken = -Infinity; // ← new

  constructor(
    public x: number,
    public y: number,
    public color: string,
    public glyph: string,
    public romaji: string,
    radius: number,
  ) {
    this.r = radius;
    log.debug('spawn', { x: this.x.toFixed(2), color, glyph: this.glyph });
  }

  /** Toggle romaji ↔ kana and play the audio, observing cooldown */
  handleClick(nowSec: number) {
    if (nowSec - this.lastSpoken < AUDIO_COOLDOWN) return;
    this.lastSpoken = nowSec;

    this.showingRomaji = !this.showingRomaji;
    Sound.playRoman(this.romaji);

    /* --- NEW: subtle vibration -------------------------------------- */
    Haptics.vibrate(HAPTIC_DURATION_MS);

    /* -------- visual feedback -------- */
    this.scale = BUBBLE_TAP_SCALE;
    this.flashTimer = BUBBLE_FLASH_DURATION;

    log.debug('toggle', { romaji: this.showingRomaji });
  }

  step(dt: number) {
    this.y -= this.speed * dt;
    if (this.y < -0.05) this.active = false; // slight overshoot so it’s fully gone

    /* smooth scale back to 1 (ease-out) ------------------------------- */
    if (this.scale !== 1) {
      this.scale += (1 - this.scale) * 10 * dt; // 10 = rate constant
      // Snap to 1 if very close to avoid artifacts or indefinite calculations
      if (Math.abs(this.scale - 1) < 0.001) {
        this.scale = 1;
      }
    }

    /* countdown flash -------------------------------------------------- */
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer < 0) this.flashTimer = 0;
    }
  }

  contains(clickPixelX: number, clickPixelY: number, cssW: number, cssH: number): boolean {
    if (!this.active) return false;

    const bubblePixelX = this.x * cssW;
    const bubblePixelY = this.y * cssH;

    const dx = clickPixelX - bubblePixelX;
    const dy = clickPixelY - bubblePixelY;
    const distanceSquared = dx * dx + dy * dy;

    const scaledR = this.r * this.scale;
    return distanceSquared <= scaledR * scaledR;
  }

  /* expose current flash opacity to renderer (0-1) */
  get flashAlpha(): number {
    return this.flashTimer > 0 ? this.flashTimer / BUBBLE_FLASH_DURATION : 0;
  }
}
