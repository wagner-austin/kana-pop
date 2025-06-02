/**
 * Bubble.js
 * Pure data class for bubble objects with physics calculations
 */

import { randRange } from '../utils/math.js';

export class Bubble {
  /**
   * Create a new bubble
   * @param {Object} options - Bubble configuration
   * @param {string} options.kana - The kana character
   * @param {string} options.romaji - The romanized version
   * @param {string} options.audio - Path to audio file
   * @param {number} options.x - X position (0-1 relative to container)
   * @param {number} options.speed - Upward movement speed
   * @param {string} options.color - Bubble color
   */
  constructor({ 
    kana, 
    romaji, 
    audio, 
    x = randRange(0.1, 0.9), 
    speed = randRange(0.02, 0.05),
    color = null
  }) {
    // Identification
    this.kana = kana;
    this.romaji = romaji;
    this.audio = audio;
    
    // Position
    this.x = x;
    this.y = 0.9; // Start just slightly below the visible area (changed from 1.1)
    
    // Physics
    this.speed = speed;
    this.baseSpeed = speed; // Keep original speed for reference
    this.amplitude = randRange(0.01, 0.03); // Horizontal sine wave amplitude
    this.frequency = randRange(1, 3); // Sine wave frequency
    this.phase = randRange(0, Math.PI * 2); // Random starting phase
    
    // Visual
    this.radius = randRange(0.07, 0.09); // Relative to container width
    this.color = color || this.getRandomColor();
    
    // State
    this.active = true;
    this.popped = false;
    this.age = 0; // Time alive in seconds
  }
  
  /**
   * Update bubble physics for the next frame
   * @param {number} deltaTime - Time in seconds since last update
   * @param {number} difficulty - Difficulty multiplier
   * @returns {boolean} Whether the bubble is still on screen
   */
  step(deltaTime, difficulty = 1) {
    if (!this.active) return false;
    
    this.age += deltaTime;
    
    // Move upward with speed adjusted by difficulty
    this.y -= this.speed * difficulty * deltaTime;
    
    // Apply horizontal sine wave movement
    const sineOffset = Math.sin(this.age * this.frequency + this.phase) * this.amplitude;
    this.x += sineOffset * deltaTime;
    
    // Keep within horizontal bounds
    if (this.x < this.radius) this.x = this.radius;
    if (this.x > 1 - this.radius) this.x = 1 - this.radius;
    
    // Return whether bubble is still on screen (with buffer)
    return this.y > -0.2;
  }
  
  /**
   * Check if a point is inside this bubble
   * @param {number} x - X coordinate (0-1 relative to container)
   * @param {number} y - Y coordinate (0-1 relative to container)
   * @returns {boolean} Whether the point is inside the bubble
   */
  contains(x, y) {
    if (!this.active || this.popped) return false;
    
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.radius;
  }
  
  /**
   * Pop this bubble
   */
  pop() {
    this.active = false;
    this.popped = true;
  }
  
  /**
   * Get a random pastel color for the bubble
   * @returns {string} CSS color variable name
   */
  getRandomColor() {
    const colors = [
      'var(--clay-rose)',
      'var(--sage-mint)',
      'var(--sky-powder)',
      'var(--lavender)',
      'var(--sun-peach)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
