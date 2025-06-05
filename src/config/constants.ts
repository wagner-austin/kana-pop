/** Pure static facts – no `window`, no services.  */
export const SPAWN_INTERVAL = 1.2; // s
export const BUBBLE_ALPHA = 0.5;

// Colours come from JSON so designers can edit without code-changes.

const FALLBACK = ['#ffaaa5', '#ffd3b6', '#c7ceea', '#e2f0cb', '#b5ead7'] as const;

let currentPalette: readonly string[] | null = null;
export function setThemePalette(p: readonly string[]) {
  currentPalette = p;
}

export function themeColours(): readonly string[] {
  return currentPalette ?? FALLBACK;
}
export function backgroundColour(): string {
  const p = currentPalette ?? FALLBACK;
  return p[2] ?? '#c7ceea';
}
export const TEXT_COLOUR_DARK = '#222';

export const FONT_FAMILY = 'Noto Sans JP, sans-serif';
export const FONT_COLOUR = TEXT_COLOUR_DARK;

export const KANA_FONT_RATIO = 0.7;

/** Minimum seconds between successive pronunciations of the *same* bubble */
export const AUDIO_COOLDOWN = 0.4;

/* ---- haptic ---------------------------------------------------------- */
export const HAPTIC_DURATION_MS = 50; // increased from 15ms for better Android feedback

/* --- tap-feedback motion constants ------------------------------------ */
export const BUBBLE_TAP_SCALE = 0.85; // peak scale multiplier (shrinks on tap)
export const BUBBLE_FLASH_DURATION = 0.15; // seconds the rim flash lasts
export const BUBBLE_FLASH_ALPHA = 0.6; // starting opacity of the rim
export const BUBBLE_STROKE_WIDTH = 4; // css-px width of the rim stroke

/* ---- Environment ---------------------------------------------------- */
export const IS_DEV = import.meta.env.DEV;

/* ---- Debugging & Parallax ------------------------------------------- */
export const DEBUG_MOTION_THROTTLE_MS = 250; // ms, for debug overlay updates
export const GYRO_INIT_GRACE_PERIOD_MS = 1000; // ms, time for gyro to report initial data
export const DEBUG_ELEMENT_ID_PREFIX = '__kanaPopDebug_'; // Prefix for debug element IDs

/* ---- Haptic Feedback Patterns --------------------------------------- */
export const HAPTIC_PULSE_GAP_MS = 40; // ms, gap for pulse patterns
