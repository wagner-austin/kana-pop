/**
 * Game.js
 * Master game controller and finite state machine
 * Coordinates bubbles, scoring, timing, and events
 */

import { StageManager } from './StageManager.js';
import AudioService from './AudioService.js';
import * as HapticsService from './HapticsService.js';
import * as StorageService from './StorageService.js';
import PromptEngine from './PromptEngine.js';

export class Game {
  /**
   * Create a new game instance
   * @param {Object} renderer - CanvasRenderer instance
   * @param {Object} settings - User settings
   */
  constructor(renderer, settings = {}) {
    // Dependencies
    this.renderer = renderer;
    this.settings = settings;
    this.stageManager = new StageManager();
    
    // Game state
    this.state = 'idle'; // idle, playing, paused, gameover
    this.score = 0;
    this.hearts = 3;
    this.timeRemaining = 0;
    this.progress = 0;
    this.bubbles = [];
    this.lastSpawnTime = 0;
    this.stats = { correct: 0, missed: 0, total: 0 };
    
    // Load game state from storage
    this.loadGameState();
    
    // Event handling
    this.eventListeners = new Map();
    
    // Bind methods
    this.tick = this.tick.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    this.handleResize = this.handleResize.bind(this);
    
    // Initialize renderer touch events
    this.renderer.setTouchHandler(this.handleTouch);
    
    // Listen for window resize
    window.addEventListener('resize', this.handleResize);
  }
  
  /**
   * Initialize audio service with game sounds
   */
  initAudio() {
    if (!this.settings.sound) return;
    
    // Initialize audio context (must be called from a user interaction)
    AudioService.init();
    
    // Preload common sound effects
    AudioService.preload('pop', './assets/audio/sfx/pop.ogg', ['./assets/audio/sfx/pop.m4a']);
    AudioService.preload('miss', './assets/audio/sfx/miss.ogg', ['./assets/audio/sfx/miss.m4a']);
    AudioService.preload('gameover', './assets/audio/sfx/gameover.ogg', ['./assets/audio/sfx/gameover.m4a']);
    AudioService.preload('levelup', './assets/audio/sfx/levelup.ogg', ['./assets/audio/sfx/levelup.m4a']);
  }
  
  /**
   * Start the game
   * @param {number} stage - Optional stage to start at
   */
  start(stage = null) {
    if (this.state === 'playing') return;
    
    // Set stage if provided
    if (stage !== null && this.stageManager.isStageUnlocked(stage)) {
      this.stageManager.setStage(stage);
    }
    
    // Reset game state
    const config = this.stageManager.getCurrentStageConfig();
    this.state = 'playing';
    this.score = 0;
    this.hearts = 3;
    this.timeRemaining = config.timeLimit;
    this.progress = 0;
    this.bubbles = [];
    // Set lastSpawnTime to now minus spawnRate to trigger immediate bubble spawn
    this.lastSpawnTime = Date.now() / 1000 - config.spawnRate;
    this.stats = { correct: 0, missed: 0, total: 0 };
    
    // Initialize audio (it needs user interaction)
    this.initAudio();
    
    // Set audio mute state based on settings
    AudioService.setMuted(!this.settings.sound);
    
    // Start game loop
    this.lastFrameTime = Date.now();
    requestAnimationFrame(this.tick);
    
    // Emit start event
    this.emit('start', { stage: this.stageManager.currentStage });
  }
  
  /**
   * Pause the game
   */
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.emit('pause');
  }
  
  /**
   * Resume the game
   */
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastFrameTime = Date.now(); // Reset frame time to avoid big jumps
    requestAnimationFrame(this.tick);
    this.emit('resume');
  }
  
  /**
   * End the game
   * @param {boolean} victory - Whether the player won
   */
  end(victory = false) {
    if (this.state === 'gameover') return;
    
    this.state = 'gameover';
    
    // Save high score if necessary
    StorageService.saveHighScore(this.score);
    
    // Try to unlock next stage
    const nextStage = this.stageManager.currentStage + 1;
    const unlocked = this.stageManager.unlockStage(nextStage, this.score);
    
    // Save unlocked stages
    StorageService.saveGame({
      unlockedStages: this.stageManager.unlockedStages,
      lastPlayedStage: this.stageManager.currentStage
    });
    
    // Play game over sound
    if (this.settings.sound) {
      AudioService.play(victory ? 'levelup' : 'gameover');
    }
    
    // Trigger haptic feedback
    if (this.settings.haptics) {
      HapticsService.vibrate(
        victory ? HapticsService.patterns.success : HapticsService.patterns.gameOver
      );
    }
    
    // Emit game over event
    this.emit('gameover', {
      score: this.score,
      stats: this.stats,
      victory: victory,
      newStageUnlocked: unlocked,
      nextStage: unlocked ? nextStage : null
    });
  }
  
  /**
   * Main game loop
   */
  tick() {
    if (this.state !== 'playing') return;
    
    const now = Date.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
    this.lastFrameTime = now;
    
    // Update time
    this.timeRemaining -= deltaTime;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.end(this.score >= this.getStagePassingScore());
      return;
    }
    
    // Update progress
    const config = this.stageManager.getCurrentStageConfig();
    this.progress = 1 - (this.timeRemaining / config.timeLimit);
    
    // Spawn new bubbles
    this.updateBubbles(deltaTime);
    
    // Render current frame
    this.renderer.draw(this.bubbles);
    
    // Emit tick event
    this.emit('tick', {
      timeRemaining: this.timeRemaining,
      progress: this.progress,
      score: this.score,
      hearts: this.hearts
    });
    
    // Continue game loop
    requestAnimationFrame(this.tick);
  }
  
  /**
   * Update bubble positions and spawn new ones
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateBubbles(deltaTime) {
    const now = Date.now() / 1000; // seconds
    const config = this.stageManager.getCurrentStageConfig();
    
    console.log(`[DEBUG] Time: ${this.timeRemaining.toFixed(1)}s, Bubbles: ${this.bubbles.length}, LastSpawn: ${(now - this.lastSpawnTime).toFixed(2)}s ago`);
    
    // Log bubble positions
    if (this.bubbles.length > 0) {
      console.log(`[DEBUG] Bubble positions:`, this.bubbles.map(b => ({x: b.x.toFixed(2), y: b.y.toFixed(2), active: b.active, popped: b.popped})));
    }
    
    // Update existing bubbles
    this.bubbles = this.bubbles.filter(bubble => {
      // Update bubble position
      const onScreen = bubble.step(deltaTime, this.getDifficultyMultiplier());
      
      // Check if bubble has moved off the top of the screen
      if (!onScreen && bubble.active && !bubble.popped) {
        console.log(`[DEBUG] Bubble missed: ${bubble.kana} (${bubble.x.toFixed(2)}, ${bubble.y.toFixed(2)})`);
        this.missBubble(bubble);
      }
      
      // Keep bubbles that are still on screen or recently popped (for animation)
      return onScreen || (bubble.popped && Date.now() - bubble.poppedTime < 500);
    });
    
    // Spawn new bubbles based on spawn rate
    if (now - this.lastSpawnTime > config.spawnRate && this.bubbles.length < config.bubbleCount) {
      console.log(`[DEBUG] Attempting to spawn bubble. Time since last: ${(now - this.lastSpawnTime).toFixed(2)}s, Current count: ${this.bubbles.length}, Max: ${config.bubbleCount}`);
      const bubble = this.stageManager.createBubble(this.stats);
      if (bubble) {
        console.log(`[DEBUG] Spawned bubble: ${bubble.kana} at (${bubble.x.toFixed(2)}, ${bubble.y.toFixed(2)})`);
        this.bubbles.push(bubble);
        this.lastSpawnTime = now;
      } else {
        console.log(`[DEBUG] Failed to spawn bubble`);
      }
    } else {
      console.log(`[DEBUG] Not spawning bubble. Time since last: ${(now - this.lastSpawnTime).toFixed(2)}s, Current count: ${this.bubbles.length}, Max: ${config.bubbleCount}`);
    }
  }
  
  /**
   * Handle touch/click events on the game area
   * @param {number} x - X coordinate (0-1)
   * @param {number} y - Y coordinate (0-1)
   */
  handleTouch(x, y) {
    if (this.state !== 'playing') return;
    
    // Check if any bubble was hit
    let hitBubble = null;
    
    for (const bubble of this.bubbles) {
      if (bubble.contains(x, y)) {
        hitBubble = bubble;
        break;
      }
    }
    
    if (hitBubble) {
      this.popBubble(hitBubble);
    }
  }
  
  /**
   * Handle a successful bubble pop
   * @param {Object} bubble - The bubble that was popped
   */
  popBubble(bubble) {
    // Update bubble state
    bubble.pop();
    bubble.poppedTime = Date.now();
    
    // Play sound
    if (this.settings.sound) {
      AudioService.play('pop');
      // Also play the kana pronunciation
      AudioService.play(bubble.kana);
    }
    
    // Trigger haptic feedback
    if (this.settings.haptics) {
      HapticsService.vibrate(HapticsService.patterns.pop);
    }
    
    // Update score
    this.score += 10;
    
    // Update stats
    this.stats.correct++;
    this.stats.total++;
    
    // Update SRS data
    PromptEngine.updatePerformance(bubble.kana, true);
    
    // Visual feedback
    this.renderer.flashPop(bubble.x, bubble.y);
    
    // Emit event
    this.emit('correct', {
      kana: bubble.kana,
      romaji: bubble.romaji,
      score: this.score
    });
  }
  
  /**
   * Handle a missed bubble (reached top of screen)
   * @param {Object} bubble - The bubble that was missed
   */
  missBubble(bubble) {
    // Lose a heart
    this.hearts--;
    
    // Play sound
    if (this.settings.sound) {
      AudioService.play('miss');
    }
    
    // Trigger haptic feedback
    if (this.settings.haptics) {
      HapticsService.vibrate(HapticsService.patterns.error);
    }
    
    // Update stats
    this.stats.missed++;
    this.stats.total++;
    
    // Update SRS data
    PromptEngine.updatePerformance(bubble.kana, false);
    
    // Emit event
    this.emit('miss', {
      kana: bubble.kana,
      romaji: bubble.romaji,
      heartsRemaining: this.hearts
    });
    
    // Check game over
    if (this.hearts <= 0) {
      this.end(false);
    }
  }
  
  /**
   * Apply new user settings
   * @param {Object} settings - New settings object
   */
  applySettings(settings) {
    this.settings = { ...this.settings, ...settings };
    
    // Update audio mute state
    AudioService.setMuted(!this.settings.sound);
    
    // Save settings
    StorageService.saveSettings(this.settings);
    
    // Emit event
    this.emit('settingsChanged', this.settings);
  }
  
  /**
   * Get the difficulty multiplier based on settings
   * @returns {number} Difficulty multiplier
   */
  getDifficultyMultiplier() {
    switch (this.settings.difficulty) {
      case 'easy': return 0.8;
      case 'hard': return 1.2;
      default: return 1.0; // normal
    }
  }
  
  /**
   * Get the score needed to pass the current stage
   * @returns {number} Passing score
   */
  getStagePassingScore() {
    const config = this.stageManager.getCurrentStageConfig();
    // Basic formula: 70% of possible score (10 points per bubble)
    return Math.round(config.bubbleCount * 10 * 0.7);
  }
  
  /**
   * Load game state from storage
   */
  loadGameState() {
    const gameState = StorageService.loadGame();
    if (gameState.unlockedStages) {
      this.stageManager.setUnlockedStages(gameState.unlockedStages);
    }
    if (gameState.lastPlayedStage) {
      this.stageManager.setStage(gameState.lastPlayedStage);
    }
  }
  
  /**
   * Handle window resize events
   */
  handleResize() {
    // Notify renderer to update its dimensions
    this.renderer.resize();
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    const callbacks = this.eventListeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data = {}) {
    if (!this.eventListeners.has(event)) return;
    const callbacks = this.eventListeners.get(event);
    callbacks.forEach(callback => callback(data));
  }
  
  /**
   * Clean up resources when game is destroyed
   */
  destroy() {
    // Stop game loop
    this.state = 'idle';
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Clear bubbles
    this.bubbles = [];
    
    // Stop all audio
    AudioService.stopAll();
  }
}
