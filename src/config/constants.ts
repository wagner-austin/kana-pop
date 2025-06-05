/** Pure static facts – no `window`, no services.  */
export const SPAWN_INTERVAL = 1.2; // s
export const BUBBLE_ALPHA = 0.5;

// Colours come from JSON so designers can edit without code-changes.
import paletteJson from '../data/palette.json' assert { type: 'json' };
export const COLOURS = paletteJson.colors as readonly string[];
export const BACKGROUND_COLOUR = COLOURS[2] ?? '#C7CEEA'; // keep one pastel for UI chrome, fallback if undefined
export const TEXT_COLOUR_DARK = '#222';

export const FONT_FAMILY = 'Noto Sans JP, sans-serif';
export const FONT_COLOUR = TEXT_COLOUR_DARK;

export const KANA_FONT_RATIO = 0.7;

/** Minimum seconds between successive pronunciations of the *same* bubble */
export const AUDIO_COOLDOWN = 0.4;

/* ---- haptic ---------------------------------------------------------- */
export const HAPTIC_DURATION_MS = 15; // tuned for quick “tick”

/* --- tap-feedback motion constants ------------------------------------ */
export const BUBBLE_TAP_SCALE = 0.85; // peak scale multiplier (shrinks on tap)
export const BUBBLE_FLASH_DURATION = 0.15; // seconds the rim flash lasts
export const BUBBLE_FLASH_ALPHA = 0.6; // starting opacity of the rim
export const BUBBLE_STROKE_WIDTH = 4; // css-px width of the rim stroke
