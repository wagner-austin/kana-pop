export const BUBBLE_RADIUS     = 20;
export const GROUND_OFFSET     = 40;        // distance from canvas bottom
export const SPAWN_INTERVAL    = 1.2;       // seconds
export const BUBBLE_ALPHA      = 0.5;

// Colours come from JSON so designers can edit without code-changes.
import paletteJson from './data/palette.json' with { type: 'json' };
export const COLOURS: readonly string[] = paletteJson.colors;
export const BACKGROUND_COLOUR = COLOURS[2]; /* "#C7CEEA" */ // keep one pastel for UI chrome
export const TEXT_COLOUR_DARK = '#222';
