/**
 * SettingsPanel.js
 * Modal panel for game settings
 */

import { createElement } from '../utils/dom.js';
import { Modal } from './Modal.js';
import * as StorageService from '../game/StorageService.js';

export class SettingsPanel {
  /**
   * Create a new settings panel
   * @param {Element} parent - Parent element to append the panel to
   * @param {Object} settings - Initial settings
   */
  constructor(parent, settings) {
    this.settings = { ...settings };
    this.modal = new Modal(parent);
    this.eventListeners = new Map();
    
    // Create settings content
    this.createContent();
    
    // Set up event handlers
    this.setupEvents();
  }
  
  /**
   * Create the settings panel content
   */
  createContent() {
    const content = createElement('div', { class: 'settings-panel' });
    
    // Title
    const title = createElement('h2', { class: 'modal-title' }, ['Settings']);
    content.appendChild(title);
    
    // Sound toggle
    const soundOption = this.createToggleOption(
      'Sound',
      'sound',
      this.settings.sound
    );
    content.appendChild(soundOption);
    
    // Haptics toggle
    const hapticsOption = this.createToggleOption(
      'Vibration',
      'haptics',
      this.settings.haptics
    );
    content.appendChild(hapticsOption);
    
    // Difficulty selector
    const difficultyOption = this.createRadioOption(
      'Difficulty',
      'difficulty',
      [
        { value: 'easy', label: 'Easy' },
        { value: 'normal', label: 'Normal' },
        { value: 'hard', label: 'Hard' }
      ],
      this.settings.difficulty
    );
    content.appendChild(difficultyOption);
    
    // Kana set selector
    const kanaSetOption = this.createRadioOption(
      'Kana Set',
      'kanaSet',
      [
        { value: 'hiragana', label: 'Hiragana' },
        { value: 'katakana', label: 'Katakana' },
        { value: 'both', label: 'Both' }
      ],
      this.settings.kanaSet
    );
    content.appendChild(kanaSetOption);
    
    // Save button
    const saveButton = createElement('button', 
      { 
        class: 'button',
        style: 'width: 100%; margin-top: 2rem;'
      }, 
      ['Save & Play']
    );
    saveButton.addEventListener('click', () => this.saveSettings());
    content.appendChild(saveButton);
    
    // Set content to modal
    this.modal.setContent(content);
  }
  
  /**
   * Create a toggle option
   * @param {string} label - Option label
   * @param {string} key - Settings key
   * @param {boolean} initialValue - Initial toggle state
   * @returns {Element} The toggle option element
   */
  createToggleOption(label, key, initialValue) {
    const container = createElement('div', { class: 'settings-option' });
    
    // Label
    const labelElement = createElement('span', { class: 'settings-option-label' }, [label]);
    container.appendChild(labelElement);
    
    // Toggle
    const toggleContainer = createElement('label', { class: 'toggle' });
    const input = createElement('input', { 
      type: 'checkbox',
      'data-key': key
    });
    input.checked = initialValue;
    
    const slider = createElement('span', { class: 'toggle-slider' });
    
    toggleContainer.appendChild(input);
    toggleContainer.appendChild(slider);
    container.appendChild(toggleContainer);
    
    return container;
  }
  
  /**
   * Create a radio option group
   * @param {string} label - Option label
   * @param {string} key - Settings key
   * @param {Array} options - Array of { value, label } objects
   * @param {string} initialValue - Initial selected value
   * @returns {Element} The radio option element
   */
  createRadioOption(label, key, options, initialValue) {
    const container = createElement('div', { class: 'settings-option-group' });
    
    // Group label
    const labelElement = createElement('div', { class: 'settings-option-label' }, [label]);
    container.appendChild(labelElement);
    
    // Radio options
    const radioGroup = createElement('div', { class: 'radio-group' });
    
    options.forEach(option => {
      const radioContainer = createElement('label', { class: 'radio-option' });
      
      const input = createElement('input', {
        type: 'radio',
        name: key,
        value: option.value,
        'data-key': key
      });
      input.checked = initialValue === option.value;
      
      const radioLabel = createElement('span', {}, [option.label]);
      
      radioContainer.appendChild(input);
      radioContainer.appendChild(radioLabel);
      radioGroup.appendChild(radioContainer);
    });
    
    container.appendChild(radioGroup);
    return container;
  }
  
  /**
   * Set up event handlers
   */
  setupEvents() {
    // Handle modal close
    this.modal.on('close', () => {
      this.emit('modalClosed');
    });
  }
  
  /**
   * Collect current settings from form inputs
   * @returns {Object} Current settings
   */
  collectSettings() {
    const newSettings = { ...this.settings };
    
    // Collect checkbox toggles
    const toggles = document.querySelectorAll('input[type="checkbox"][data-key]');
    toggles.forEach(toggle => {
      const key = toggle.getAttribute('data-key');
      newSettings[key] = toggle.checked;
    });
    
    // Collect radio selections
    const radioGroups = document.querySelectorAll('input[type="radio"][data-key]:checked');
    radioGroups.forEach(radio => {
      const key = radio.getAttribute('data-key');
      newSettings[key] = radio.value;
    });
    
    return newSettings;
  }
  
  /**
   * Save settings and close modal
   */
  saveSettings() {
    // Collect settings from form
    const newSettings = this.collectSettings();
    
    // Update settings
    this.settings = newSettings;
    
    // Save to storage
    StorageService.saveSettings(newSettings);
    
    // Emit change event
    this.emit('settingsChanged', newSettings);
    
    // Close modal
    this.modal.close();
  }
  
  /**
   * Open the settings panel
   */
  open() {
    this.modal.open();
  }
  
  /**
   * Close the settings panel
   */
  close() {
    this.modal.close();
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
    this.modal.destroy();
  }
}
