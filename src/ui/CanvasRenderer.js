/**
 * CanvasRenderer.js
 * Handles rendering bubbles to a canvas element
 */

import { createElement } from '../utils/dom.js';

export class CanvasRenderer {
  /**
   * Create a new canvas renderer
   * @param {Element} parent - Parent element to append the canvas to
   */
  constructor(parent) {
    // Create container and canvas
    this.container = createElement('div', { class: 'bubble-field' });
    this.canvas = createElement('canvas', { class: 'bubble-canvas' });
    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);
    
    // Get context
    this.ctx = this.canvas.getContext('2d');
    
    // Set up touch handler
    this.touchHandler = null;
    this.setupTouchEvents();
    
    // Resize canvas to match container
    this.resize();
    
    // Animation properties
    this.popEffects = [];
  }
  
  /**
   * Set up touch/click events
   */
  setupTouchEvents() {
    // Touch event handler
    const handleInteraction = (event) => {
      if (!this.touchHandler) return;
      
      let x, y;
      
      // Handle both touch and mouse events
      if (event.type.startsWith('touch')) {
        const touch = event.touches[0] || event.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        x = (touch.clientX - rect.left) / rect.width;
        y = (touch.clientY - rect.top) / rect.height;
      } else {
        const rect = this.canvas.getBoundingClientRect();
        x = (event.clientX - rect.left) / rect.width;
        y = (event.clientY - rect.top) / rect.height;
      }
      
      this.touchHandler(x, y);
    };
    
    // Add event listeners
    this.canvas.addEventListener('click', handleInteraction);
    this.canvas.addEventListener('touchstart', handleInteraction);
  }
  
  /**
   * Set the touch handler function
   * @param {Function} handler - Function to call on touch/click
   */
  setTouchHandler(handler) {
    this.touchHandler = handler;
  }
  
  /**
   * Resize the canvas to match the container
   */
  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set logical size
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Set actual pixel size (accounting for high-DPI screens)
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    
    // Scale all drawing operations
    this.ctx.scale(dpr, dpr);
    
    // Store dimensions for calculations
    this.width = width;
    this.height = height;
  }
  
  /**
   * Draw all bubbles
   * @param {Array} bubbles - Array of bubble objects
   */
  draw(bubbles) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw bubbles
    bubbles.forEach(bubble => {
      if (bubble.active || bubble.popped) {
        this.drawBubble(bubble);
      }
    });
    
    // Draw pop effects
    this.updatePopEffects();
  }
  
  /**
   * Draw a single bubble
   * @param {Object} bubble - Bubble object
   */
  drawBubble(bubble) {
    const x = bubble.x * this.width;
    const y = bubble.y * this.height;
    const radius = bubble.radius * this.width;
    
    // Save context
    this.ctx.save();
    
    // Apply scaling effect if popped
    if (bubble.popped) {
      const elapsed = Date.now() - bubble.poppedTime;
      const scale = 1 + (elapsed / 500);
      const alpha = 1 - (elapsed / 500);
      
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(x, y);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-x, -y);
    }
    
    // Draw bubble background
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = bubble.color;
    this.ctx.fill();
    
    // Add subtle gradient
    const gradient = this.ctx.createRadialGradient(
      x, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw kana text
    if (!bubble.popped) {
      this.ctx.font = `${radius * 1.2}px 'Noto Sans JP', sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = 'var(--ink)';
      this.ctx.fillText(bubble.kana, x, y);
    }
    
    // Restore context
    this.ctx.restore();
  }
  
  /**
   * Create a pop effect at the specified position
   * @param {number} x - X position (0-1)
   * @param {number} y - Y position (0-1)
   */
  flashPop(x, y) {
    this.popEffects.push({
      x: x * this.width,
      y: y * this.height,
      radius: 10,
      maxRadius: 50,
      alpha: 1,
      startTime: Date.now()
    });
  }
  
  /**
   * Update and draw pop effects
   */
  updatePopEffects() {
    const now = Date.now();
    const remainingEffects = [];
    
    this.popEffects.forEach(effect => {
      const elapsed = now - effect.startTime;
      const duration = 500; // ms
      
      if (elapsed < duration) {
        // Calculate animation progress
        const progress = elapsed / duration;
        const radius = effect.radius + (effect.maxRadius - effect.radius) * progress;
        const alpha = 1 - progress;
        
        // Draw effect
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        remainingEffects.push(effect);
      }
    });
    
    this.popEffects = remainingEffects;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
