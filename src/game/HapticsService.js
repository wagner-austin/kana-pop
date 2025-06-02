/**
 * HapticsService.js
 * A simple service for handling device vibration
 * This is a separate module to make it easy to stub for desktop browsers
 */

/**
 * Checks if the vibration API is available
 * @returns {boolean} Whether vibration is supported
 */
export function isSupported() {
  return 'vibrate' in navigator;
}

/**
 * Triggers device vibration with the given pattern
 * @param {number|number[]} pattern - Duration in ms or pattern array [vibrate, pause, vibrate, ...]
 * @returns {boolean} Whether vibration was triggered
 */
export function vibrate(pattern) {
  if (!isSupported()) {
    return false;
  }
  
  try {
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    console.error('Vibration failed:', error);
    return false;
  }
}

/**
 * Predefined vibration patterns for common game events
 */
export const patterns = {
  // Short pop for successful bubble pop
  pop: 50,
  
  // Double buzz for errors
  error: [50, 100, 50],
  
  // Success pattern for completing a level
  success: [50, 50, 50, 50, 100, 100],
  
  // Game over pattern
  gameOver: [100, 50, 100, 50, 300]
};

/**
 * Stops any ongoing vibration
 */
export function stop() {
  if (isSupported()) {
    navigator.vibrate(0);
  }
}
