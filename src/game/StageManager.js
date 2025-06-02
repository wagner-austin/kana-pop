/**
 * StageManager.js
 * Manages game stages, unlocks, and bubble pools for each stage
 */

import { Bubble } from './Bubble.js';
import PromptEngine from './PromptEngine.js';

export class StageManager {
  constructor() {
    this.currentStage = 1;
    this.unlockedStages = [1];
    this.stageConfigs = this.initStageConfigs();
  }

  /**
   * Initialize stage configurations
   * @returns {Object} Stage configuration map
   */
  initStageConfigs() {
    return {
      // Hiragana stages
      1: {
        name: 'Vowels',
        description: 'あ い う え お',
        bubbleCount: 5,
        spawnRate: 1, // seconds between bubbles (reduced from 3 to 1 for faster spawning)
        timeLimit: 60,
        kanaType: 'hiragana',
        unlockRequirement: null // First stage is always unlocked
      },
      2: {
        name: 'K-Row',
        description: 'か き く け こ',
        bubbleCount: 8,
        spawnRate: 2.5,
        timeLimit: 75,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 1, score: 70 }
      },
      3: {
        name: 'S-Row',
        description: 'さ し す せ そ',
        bubbleCount: 8,
        spawnRate: 2.5,
        timeLimit: 75,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 2, score: 70 }
      },
      4: {
        name: 'T-Row',
        description: 'た ち つ て と',
        bubbleCount: 10,
        spawnRate: 2.2,
        timeLimit: 90,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 3, score: 70 }
      },
      5: {
        name: 'N-Row',
        description: 'な に ぬ ね の',
        bubbleCount: 10,
        spawnRate: 2.2,
        timeLimit: 90,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 4, score: 70 }
      },
      6: {
        name: 'H-Row',
        description: 'は ひ ふ へ ほ',
        bubbleCount: 12,
        spawnRate: 2,
        timeLimit: 100,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 5, score: 70 }
      },
      7: {
        name: 'M-Row',
        description: 'ま み む め も',
        bubbleCount: 12,
        spawnRate: 2,
        timeLimit: 100,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 6, score: 70 }
      },
      8: {
        name: 'Y-Row',
        description: 'や ゆ よ',
        bubbleCount: 15,
        spawnRate: 1.8,
        timeLimit: 120,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 7, score: 70 }
      },
      9: {
        name: 'R-Row',
        description: 'ら り る れ ろ',
        bubbleCount: 15,
        spawnRate: 1.8,
        timeLimit: 120,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 8, score: 70 }
      },
      10: {
        name: 'W-Row & ん',
        description: 'わ を ん',
        bubbleCount: 20,
        spawnRate: 1.5,
        timeLimit: 150,
        kanaType: 'hiragana',
        unlockRequirement: { stage: 9, score: 70 }
      },
      // Katakana stages
      11: {
        name: 'Katakana Vowels',
        description: 'ア イ ウ エ オ',
        bubbleCount: 10,
        spawnRate: 2.5,
        timeLimit: 90,
        kanaType: 'katakana',
        unlockRequirement: { stage: 10, score: 80 }
      },
      // More stages can be added as needed...
      
      // Mixed stages (both hiragana and katakana)
      20: {
        name: 'Mixed Challenge',
        description: 'Hiragana & Katakana',
        bubbleCount: 30,
        spawnRate: 1.2,
        timeLimit: 180,
        kanaType: 'both',
        unlockRequirement: { stage: 15, score: 80 }
      }
    };
  }

  /**
   * Set the current active stage
   * @param {number} stage - Stage number
   * @returns {boolean} Whether stage was successfully set
   */
  setStage(stage) {
    if (!this.isStageUnlocked(stage)) {
      console.warn(`Stage ${stage} is not unlocked yet`);
      return false;
    }
    
    if (!this.stageConfigs[stage]) {
      console.error(`Stage ${stage} does not exist`);
      return false;
    }
    
    this.currentStage = stage;
    return true;
  }

  /**
   * Get the current stage configuration
   * @returns {Object} Stage configuration
   */
  getCurrentStageConfig() {
    return this.stageConfigs[this.currentStage];
  }

  /**
   * Check if a stage is unlocked
   * @param {number} stage - Stage number to check
   * @returns {boolean} Whether the stage is unlocked
   */
  isStageUnlocked(stage) {
    return this.unlockedStages.includes(stage);
  }

  /**
   * Set the list of unlocked stages
   * @param {number[]} stages - Array of unlocked stage numbers
   */
  setUnlockedStages(stages) {
    this.unlockedStages = [...stages];
  }

  /**
   * Attempt to unlock a new stage
   * @param {number} stage - Stage to unlock
   * @param {number} previousStageScore - Score from the previous stage
   * @returns {boolean} Whether the stage was unlocked
   */
  unlockStage(stage, previousStageScore) {
    if (this.isStageUnlocked(stage)) {
      return true; // Already unlocked
    }
    
    const config = this.stageConfigs[stage];
    if (!config) {
      return false; // Stage doesn't exist
    }
    
    const requirement = config.unlockRequirement;
    if (!requirement) {
      // No requirement, unlock it
      this.unlockedStages.push(stage);
      return true;
    }
    
    // Check if requirement is met
    if (
      this.isStageUnlocked(requirement.stage) && 
      previousStageScore >= requirement.score
    ) {
      this.unlockedStages.push(stage);
      return true;
    }
    
    return false;
  }

  /**
   * Generate a new bubble with a kana from the current stage
   * @param {Object} stats - User performance stats
   * @returns {Bubble} A new bubble instance
   */
  createBubble(stats = {}) {
    const config = this.getCurrentStageConfig();
    const prompt = PromptEngine.nextPrompt(this.currentStage, stats, config.kanaType);
    
    if (!prompt) {
      console.error('Failed to get prompt for stage:', this.currentStage);
      return null;
    }
    
    return new Bubble(prompt);
  }

  /**
   * Get all stage configurations
   * @returns {Object} All stage configs
   */
  getAllStageConfigs() {
    return this.stageConfigs;
  }

  /**
   * Get a list of all available stages
   * @returns {Array} Array of stage objects with id, name, and unlocked status
   */
  getStageList() {
    return Object.entries(this.stageConfigs).map(([id, config]) => ({
      id: parseInt(id, 10),
      name: config.name,
      description: config.description,
      unlocked: this.isStageUnlocked(parseInt(id, 10)),
      requirement: config.unlockRequirement
    }));
  }
}
