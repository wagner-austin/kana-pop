/**
 * Clamps a value between a minimum and maximum value
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns a random number between min and max
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} A random number in the range [min, max)
 */
export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Linear interpolation between two values
 * @param {number} a - The start value
 * @param {number} b - The end value
 * @param {number} t - The interpolation factor (0-1)
 * @returns {number} The interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
