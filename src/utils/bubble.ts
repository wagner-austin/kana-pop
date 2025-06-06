import { BUBBLE_SIZE_RATIO } from '../config/constants';

/**
 * Calculate bubble radius based on screen dimensions
 * Using the centralized BUBBLE_SIZE_RATIO constant
 */
export function bubbleRadius(cssW: number, cssH: number): number {
  return Math.min(cssW, cssH) * BUBBLE_SIZE_RATIO;
}
