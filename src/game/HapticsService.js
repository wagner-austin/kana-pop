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
 * @returns {Promise<boolean>} Promise resolving to whether vibration was triggered
 */
export function vibrate(pattern) {
  // Return a resolved promise if vibration isn't supported
  // This ensures the promise chain in Game.js keeps flowing
  if (!isSupported()) {
    return Promise.resolve(false);
  }
  
  return new Promise(resolve => {
    try {
      // On iOS, vibrate exists but silently fails
      // We'll resolve the promise in either case so the promise chain continues
      const result = navigator.vibrate(pattern);
      
      // For most browsers, result is undefined
      // Some implementations might return a boolean
      resolve(result !== false);
    } catch (error) {
      console.error('Vibration failed:', error);
      // Resolve with false but don't break the promise chain
      resolve(false);
    }
  });
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
 * @returns {Promise<boolean>} Promise resolving to whether vibration was stopped
 */
export function stop() {
  if (!isSupported()) {
    return Promise.resolve(false);
  }
  
  return new Promise(resolve => {
    try {
      const result = navigator.vibrate(0);
      resolve(result !== false);
    } catch (error) {
      console.error('Failed to stop vibration:', error);
      resolve(false);
    }
  });
}
