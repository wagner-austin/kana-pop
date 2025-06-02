/**
 * Modal.js
 * Generic modal overlay component
 */

import { createElement } from '../utils/dom.js';

export class Modal {
  /**
   * Create a new modal
   * @param {Element} parent - Parent element to append the modal to
   */
  constructor(parent) {
    // Create elements
    this.overlay = createElement('div', { class: 'modal-overlay' });
    this.content = createElement('div', { class: 'modal-content' });
    
    // Add to DOM
    this.overlay.appendChild(this.content);
    parent.appendChild(this.overlay);
    
    // Binding
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    
    // Events
    this.overlay.addEventListener('click', this.handleOutsideClick);
    
    // State
    this.isOpen = false;
    this.eventListeners = new Map();
  }
  
  /**
   * Set the content of the modal
   * @param {string|Element} content - Content to set
   */
  setContent(content) {
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else if (content instanceof Element) {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }
  
  /**
   * Open the modal
   */
  open() {
    this.isOpen = true;
    this.overlay.classList.add('active');
    this.emit('open');
  }
  
  /**
   * Close the modal
   */
  close() {
    this.isOpen = false;
    this.overlay.classList.remove('active');
    this.emit('close');
  }
  
  /**
   * Toggle the modal state
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * Handle clicks outside the modal content
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    if (event.target === this.overlay) {
      this.close();
    }
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
   * Clean up resources
   */
  destroy() {
    this.overlay.removeEventListener('click', this.handleOutsideClick);
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
