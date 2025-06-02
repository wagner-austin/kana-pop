/**
 * StorageService.js
 * Handles all localStorage operations to keep game state persistent
 */

// Constants for storage keys
const KEYS = {
  SETTINGS: 'kana-pop-settings',
  GAME_STATE: 'kana-pop-game',
  HIGHSCORE: 'kana-pop-highscore'
};

// Default settings if none are saved
const DEFAULT_SETTINGS = {
  sound: true,
  haptics: true,
  difficulty: 'normal', // 'easy', 'normal', 'hard'
  kanaSet: 'hiragana' // 'hiragana', 'katakana', 'both'
};

// Default game state if none is saved
const DEFAULT_GAME_STATE = {
  unlockedStages: [1],
  lastPlayedStage: 1
};

/**
 * Load user settings from localStorage or return defaults
 * @returns {Object} User settings
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save user settings to localStorage
 * @param {Object} settings - User settings to save
 * @returns {boolean} Success status
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Load game state from localStorage or return defaults
 * @returns {Object} Game state
 */
export function loadGame() {
  try {
    const stored = localStorage.getItem(KEYS.GAME_STATE);
    if (stored) {
      return { ...DEFAULT_GAME_STATE, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return { ...DEFAULT_GAME_STATE };
}

/**
 * Save game state to localStorage
 * @param {Object} gameState - Game state to save
 * @returns {boolean} Success status
 */
export function saveGame(gameState) {
  try {
    localStorage.setItem(KEYS.GAME_STATE, JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    return false;
  }
}

/**
 * Get the current high score
 * @returns {number} High score
 */
export function getHighScore() {
  try {
    const score = localStorage.getItem(KEYS.HIGHSCORE);
    return score ? parseInt(score, 10) : 0;
  } catch (error) {
    console.error('Failed to load high score:', error);
    return 0;
  }
}

/**
 * Save a new high score if it's higher than the current one
 * @param {number} score - New score
 * @returns {boolean} Whether the score was saved as a new high score
 */
export function saveHighScore(score) {
  try {
    const currentHighScore = getHighScore();
    if (score > currentHighScore) {
      localStorage.setItem(KEYS.HIGHSCORE, score.toString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save high score:', error);
    return false;
  }
}
