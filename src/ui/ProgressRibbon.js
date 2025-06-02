/**
 * ProgressRibbon.js
 * A slim progress bar that shows game completion percentage
 */

import { createElement } from '../utils/dom.js';

export class ProgressRibbon {
  /**
   * Create a new progress ribbon
   * @param {Element} parent - Parent element to append the ribbon to
   */
  constructor(parent) {
    // Create the ribbon element
    this.element = createElement('div', { 
      class: 'progress-ribbon',
      style: 'width: 0%' 
    });
    
    // Add to parent
    parent.appendChild(this.element);
    
    // Initialize state
    this.percent = 0;
  }
  
  /**
   * Update the progress ribbon
   * @param {number} percent - Progress percentage (0-1)
   */
  update(percent) {
    // Clamp to valid range
    this.percent = Math.max(0, Math.min(1, percent));
    
    // Update width
    this.element.style.width = `${this.percent * 100}%`;
    
    // Add pulse animation when nearly complete
    if (this.percent > 0.9) {
      this.element.classList.add('pulse');
    } else {
      this.element.classList.remove('pulse');
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
