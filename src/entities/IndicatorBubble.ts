import Sound from '../services/SoundService';
import Haptics from '../services/HapticService';

import Bubble from './Bubble';

import Logger from '@/utils/Logger';

const log = new Logger('Indicator');

/**
 * A static “target” bubble drawn at the top of the screen that shows
 * romaji → hiragana → katakana in sequence when tapped, allowing learners
 * to see both kana variants for the active syllable.
 */
export default class IndicatorBubble extends Bubble {
  private mode: 0 | 1 | 2 = 0; // 0=Romaji, 1=H, 2=K
  constructor(
    x: number,
    y: number,
    colour: string,
    private readonly hira: string,
    private readonly kata: string,
    romaji: string,
    radius: number,
  ) {
    // Start with romaji text (glyph placeholder not used while showingRomaji=true)
    super(x, y, colour, hira, romaji, radius);
    this.speed = 0;
    this.showingRomaji = true;
    this.glyph = this.hira; // ensure kana glyph initialised
  }

  /** Handle tap: cycle R→H→K → R … */
  override handleClick(_nowSec: number) {
    log.info(`Indicator cycle tap. Mode was ${this.mode}`);
    // Haptic + spring animation regardless of mode
    Haptics.vibratePattern('pop').catch(() => {});
    this.triggerTapAnimation();

    // Advance mode
    this.mode = ((this.mode + 1) % 3) as 0 | 1 | 2;

    if (this.mode === 0) {
      this.showingRomaji = true;
    } else {
      this.showingRomaji = false;
      this.glyph = this.mode === 1 ? this.hira : this.kata;
    }

    // Reset any pending transition in parent class
    // (indicator uses instant switch, not fade)

    // Play romaji sound each tap (consistent feedback)
    Sound.playRoman(this.romaji);

    // brief white rim flash as visual confirmation
    this.flashTimer = 0.15;
    log.info(
      `Indicator now showing ${this.mode === 0 ? 'romaji' : this.mode === 1 ? 'hiragana' : 'katakana'}`,
    );
  }

  /** Keep animation timers but cancel vertical drift. */
  override step(dt: number): void {
    const originalY = this.y;
    super.step(dt);
    this.y = originalY;
  }
}
