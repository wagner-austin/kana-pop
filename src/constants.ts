export const SPAWN_INTERVAL = 1.2; // seconds
export const BUBBLE_ALPHA = 0.5;

import ResizeService from './services/ResizeService'; // Adjusted path assuming constants.ts is in src/

// Colours come from JSON so designers can edit without code-changes.
import paletteJson from './data/palette.json' assert { type: 'json' };
export const COLOURS = paletteJson.colors as readonly string[];
export const BACKGROUND_COLOUR = COLOURS[2] ?? '#C7CEEA'; /* "#C7CEEA" */ // keep one pastel for UI chrome, fallback if undefined
export const TEXT_COLOUR_DARK = '#222';

export function bubbleRadius(): number {
  // Ensure ResizeService is initialized and provides valid dimensions
  const cssWidth = ResizeService.cssWidth || window.innerWidth; // Fallback if ResizeService not ready
  const cssHeight = ResizeService.cssHeight || window.innerHeight; // Fallback if ResizeService not ready
  return Math.min(cssWidth, cssHeight) * 0.06;
}

export const FONT_FAMILY = 'Noto Sans JP, sans-serif';
export const FONT_COLOUR = TEXT_COLOUR_DARK;

export const KANA_FONT_RATIO = 0.7;

/** Minimum seconds between successive pronunciations of the *same* bubble */
export const AUDIO_COOLDOWN = 0.4;
