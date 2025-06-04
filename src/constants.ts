export const BUBBLE_RADIUS     = 50;
export const SPAWN_INTERVAL    = 1.2;       // seconds
export const BUBBLE_ALPHA      = 0.5;

// Colours come from JSON so designers can edit without code-changes.
import paletteJson from './data/palette.json' assert { type: 'json' };
export const COLOURS = paletteJson.colors as readonly string[];
export const BACKGROUND_COLOUR = COLOURS[2] ?? '#C7CEEA'; /* "#C7CEEA" */ // keep one pastel for UI chrome, fallback if undefined
export const TEXT_COLOUR_DARK = '#222';
