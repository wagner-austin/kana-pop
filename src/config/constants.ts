/** Pure static facts – no `window`, no services.  */
export const SPAWN_INTERVAL = 1.2; // s
export const BUBBLE_ALPHA = 0.36;

// Colours come from JSON so designers can edit without code-changes.

const FALLBACK = ['#ffaaa5', '#ffd3b6', '#c7ceea', '#e2f0cb', '#b5ead7'] as const;

let currentPalette: readonly string[] | null = null;
export function setThemePalette(p: readonly string[]) {
  // Ensure the palette is non-empty before setting it
  if (p && p.length > 0) {
    currentPalette = p;
  }
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

/* --- bubble and text size constants ---------------------------------- */
/** Bubble size as a fraction of the smallest screen dimension */
export const BUBBLE_SIZE_RATIO = 0.1;

/** Kana text size as a fraction of bubble radius */
export const KANA_FONT_RATIO = 0.85;

/** Romaji text size as a fraction of bubble radius */
export const ROMAJI_FONT_RATIO = 0.65;

/** Minimum seconds between successive pronunciations of the *same* bubble */
export const AUDIO_COOLDOWN = 0.4;

/* ---- haptic ---------------------------------------------------------- */
export const HAPTIC_DURATION_MS = 50; // increased from 15ms for better Android feedback

/* --- tap-feedback motion constants ------------------------------------ */
/** Bubble tap "spring" animation timing (seconds) */
export const BUBBLE_SQUASH_TIME = 0.08; // time to shrink (squash)
export const BUBBLE_STRETCH_TIME = 0.1; // time to overshoot (stretch)
export const BUBBLE_SETTLE_TIME = 0.14; // time to settle at 1
export const BUBBLE_SQUASH_SCALE = 0.85; // min scale when squashed
export const BUBBLE_STRETCH_SCALE = 1.2; // max scale when stretched

export const BUBBLE_FLASH_DURATION = 0.0; // seconds the rim flash lasts

/* --- text fade transition constants ---------------------------------- */
export const TEXT_FADE_DURATION = 0.15; // seconds for text fade transition
export const BUBBLE_FLASH_ALPHA = 0.6; // starting opacity of the rim
export const BUBBLE_STROKE_WIDTH = 4; // css-px width of the rim stroke

/** How aggressively a bubble's scale eases back to 1 ( units ≈ 1/seconds ) - legacy */
export const BUBBLE_SCALE_EASE_RATE = 5;

/* ---- Environment ---------------------------------------------------- */
export const IS_DEV = import.meta.env.DEV;

/* ---- Debugging & Parallax ------------------------------------------- */
export const DEBUG_MOTION_THROTTLE_MS = 250; // ms, for debug overlay updates
export const GYRO_INIT_GRACE_PERIOD_MS = 1000; // ms, time for gyro to report initial data
export const DEBUG_ELEMENT_ID_PREFIX = '__kanaPopDebug_'; // Prefix for debug element IDs

/* ---- Haptic Feedback Patterns --------------------------------------- */
export const HAPTIC_PULSE_GAP_MS = 40; // ms, gap for pulse patterns
export const HAPTIC_THROTTLE_MS_SINGLE = 60; // ms, min time between single haptic pulses
export const HAPTIC_THROTTLE_MS_PATTERN = 250; // ms, min time between haptic patterns

/** user-pref default (overridden by StorageService key 'kanaPop.haptics') */
export const HAPTICS_DEFAULT_ENABLED = true;

/* ---- Sound effects ------------------------------------------------- */
/** Folder under /public/audio that stores short UI / game SFX */
export const SFX_BASE_PATH = 'sfx/Pop/';
/** Randomised “bubble pop” variants.  Add more files here ↴ */
export const POP_SFX_FILES = ['pop1.mp3', 'pop2.mp3', 'pop3.mp3', 'pop4.mp3', 'pop5.mp3'] as const;
