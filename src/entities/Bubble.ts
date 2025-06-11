import Logger from '../utils/Logger';
import {
  AUDIO_COOLDOWN,
  BUBBLE_FLASH_DURATION,
  BUBBLE_SQUASH_TIME,
  BUBBLE_STRETCH_TIME,
  BUBBLE_SETTLE_TIME,
  BUBBLE_SQUASH_SCALE,
  BUBBLE_STRETCH_SCALE,
  TEXT_FADE_DURATION,
  BUBBLE_BASE_SPEED,
  BUBBLE_DIRECTION,
} from '../config/constants';
import Sound from '../services/SoundService';
import Haptics from '../services/HapticService';
const log = new Logger('Bubble');

export default class Bubble {
  active: boolean = true;
  /** vertical speed (fraction of canvas height per second) */
  public speed = BUBBLE_BASE_SPEED;
  public r: number;
  /** current visual scale (1 == normal size) */
  private _scale = 1;
  /** animation state for the spring animation */
  private animPhase: 'none' | 'squash' | 'stretch' | 'settle' = 'none';
  /** animation timer for the current phase */
  private animTime = 0;

  /** Text scale factor for the current text */
  private textScale = 1;
  /** Text opacity for fade transition */
  private textOpacity = 1;
  /** Whether text is in transition */
  private isTextTransitioning = false;
  /** Time left in text transition */
  private textTransitionTime = 0;

  /** countdown timer for the white rim flash */
  public flashTimer = 0;
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

    /* --- Haptic feedback ------------------------------------------- */
    Haptics.vibratePattern('pop').catch(() => {
      /* ignore failures */
    });

    /* -------- visual feedback: spring tap -------- */
    this.triggerTapAnimation();

    /* -------- start text transition -------- */
    this.startTextTransition();

    // Play sound
    Sound.playRoman(this.romaji);

    this.flashTimer = BUBBLE_FLASH_DURATION;
    log.debug('toggle', { romaji: this.showingRomaji });
  }

  /** Allows triggering a tap/spring animation externally (future extensibility) */
  triggerTapAnimation() {
    this.animPhase = 'squash';
    this.animTime = 0;
    this.scale = 1; // Start at normal, so squash always interpolates from 1
    // Apply shrink effect to current text
    this.textScale = BUBBLE_SQUASH_SCALE;
  }

  /** Start text fade transition */
  startTextTransition() {
    this.isTextTransitioning = true;
    this.textTransitionTime = TEXT_FADE_DURATION;
    this.textOpacity = 0; // Fade out current text
  }

  step(dt: number) {
    const dir = BUBBLE_DIRECTION === 'up' ? -1 : 1;
    this.y += this.speed * dt * dir;
    if (BUBBLE_DIRECTION === 'up') {
      if (this.y < -0.05) this.active = false;
    } else {
      if (this.y > 1.05) this.active = false;
    }

    // Tap spring animation state machine
    switch (this.animPhase) {
      case 'squash':
        this.animTime += dt;
        if (this.animTime >= BUBBLE_SQUASH_TIME) {
          this.animTime = 0;
          this.animPhase = 'stretch';
          this.scale = BUBBLE_SQUASH_SCALE;
        } else {
          // ease to squashed scale
          const t = this.animTime / BUBBLE_SQUASH_TIME;
          this.scale = lerp(1, BUBBLE_SQUASH_SCALE, easeOutQuad(t));
        }
        break;

      case 'stretch':
        this.animTime += dt;
        if (this.animTime >= BUBBLE_STRETCH_TIME) {
          this.animTime = 0;
          this.animPhase = 'settle';
          this.scale = BUBBLE_STRETCH_SCALE;
        } else {
          // ease to overshoot scale
          const t = this.animTime / BUBBLE_STRETCH_TIME;
          this.scale = lerp(BUBBLE_SQUASH_SCALE, BUBBLE_STRETCH_SCALE, easeOutQuad(t));
        }
        break;

      case 'settle':
        this.animTime += dt;
        if (this.animTime >= BUBBLE_SETTLE_TIME) {
          this.animTime = 0;
          this.animPhase = 'none';
          this.scale = 1;
        } else {
          // ease back to normal
          const t = this.animTime / BUBBLE_SETTLE_TIME;
          this.scale = lerp(BUBBLE_STRETCH_SCALE, 1, easeOutQuad(t));
        }
        break;

      case 'none':
      default:
        // Nothing to do
        break;
    }

    /* countdown flash -------------------------------------------------- */
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer < 0) this.flashTimer = 0;
    }

    /* text transition animation ------------------------------------- */
    if (this.isTextTransitioning) {
      this.textTransitionTime -= dt;

      if (this.textTransitionTime <= 0) {
        // Transition complete - switch text type and reset
        this.showingRomaji = !this.showingRomaji;
        this.isTextTransitioning = false;
        this.textOpacity = 1; // Show new text at full opacity
        this.textScale = 1; // Show new text at normal scale
      } else {
        // During fade-out phase
        this.textOpacity = Math.max(0, this.textTransitionTime / TEXT_FADE_DURATION);
      }
    } else if (this.textScale < 1) {
      // If not transitioning but text is shrunk, ease back to normal
      this.textScale = Math.min(1, this.textScale + dt * 5);
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

  /* expose text opacity for fading */
  get currentTextOpacity(): number {
    return this.textOpacity;
  }

  /* expose text scale for animation */
  get currentTextScale(): number {
    return this.textScale;
  }

  /** Get current scale value */
  get scale(): number {
    return this._scale;
  }

  /** Set scale value */
  set scale(value: number) {
    this._scale = value;
  }
}

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Progress (0-1)
 * @returns Interpolated value
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Quadratic ease-out function for smooth animations
 * @param t Progress (0-1)
 * @returns Eased value
 */
function easeOutQuad(t: number): number {
  return t < 1 ? 1 - (1 - t) * (1 - t) : 1;
}
