/**
 * StatusBar.js
 * Renders and manages the game status bar with hearts, timer, and controls
 */

import { createElement } from '../utils/dom.js';
import AudioService from '../game/AudioService.js';

export class StatusBar {
  /**
   * Create a new status bar
   * @param {Element} parent - Parent element to append the status bar to
   * @param {Object} game - Game instance
   */
  constructor(parent, game) {
    this.game = game;
    
    // Create container
    this.container = createElement('div', { class: 'status-bar' });
    
    // Create hearts container
    this.heartsContainer = createElement('div', { class: 'hearts' });
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      this.hearts.push(this.createHeart());
    }
    
    // Create timer
    this.timerContainer = createElement('div', { class: 'timer-pill' });
    this.timerIcon = this.createTimerIcon();
    this.timerText = createElement('span', { class: 'timer-text' }, ['60']);
    this.timerContainer.appendChild(this.timerIcon);
    this.timerContainer.appendChild(this.timerText);
    
    // Create controls
    this.controlsContainer = createElement('div', { class: 'controls' });
    this.soundButton = this.createSoundButton();
    this.settingsButton = this.createSettingsButton();
    this.controlsContainer.appendChild(this.soundButton);
    this.controlsContainer.appendChild(this.settingsButton);
    
    // Assemble status bar
    this.container.appendChild(this.heartsContainer);
    this.container.appendChild(this.timerContainer);
    this.container.appendChild(this.controlsContainer);
    
    // Add to parent
    parent.appendChild(this.container);
    
    // Bind event handlers
    this.handleTick = this.handleTick.bind(this);
    this.handleMiss = this.handleMiss.bind(this);
    this.handleSoundToggle = this.handleSoundToggle.bind(this);
    
    // Register game event listeners
    this.game.on('tick', this.handleTick);
    this.game.on('miss', this.handleMiss);
    
    // Add click listeners
    this.soundButton.addEventListener('click', this.handleSoundToggle);
    
    // Apply initial settings
    this.updateSoundButton(this.game.settings.sound);
  }
  
  /**
   * Create a heart icon element
   * @returns {Element} Heart element
   */
  createHeart() {
    const heart = createElement('div', { class: 'heart active' });
    heart.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>`;
    this.heartsContainer.appendChild(heart);
    return heart;
  }
  
  /**
   * Create timer icon
   * @returns {Element} Timer icon element
   */
  createTimerIcon() {
    const icon = createElement('div', { class: 'timer-icon' });
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>`;
    return icon;
  }
  
  /**
   * Create sound toggle button
   * @returns {Element} Sound button element
   */
  createSoundButton() {
    const button = createElement('button', { class: 'icon-button sound-button' });
    return button;
  }
  
  /**
   * Create settings button
   * @returns {Element} Settings button element
   */
  createSettingsButton() {
    const button = createElement('button', { class: 'icon-button settings-button' });
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
    return button;
  }
  
  /**
   * Update sound button icon based on state
   * @param {boolean} soundEnabled - Whether sound is enabled
   */
  updateSoundButton(soundEnabled) {
    if (soundEnabled) {
      this.soundButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>`;
    } else {
      this.soundButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>`;
    }
  }
  
  /**
   * Handle game tick event
   * @param {Object} data - Tick event data
   */
  handleTick(data) {
    // Update timer
    const seconds = Math.ceil(data.timeRemaining);
    this.timerText.textContent = seconds;
    
    // Add warning class when time is low
    if (seconds <= 10) {
      this.timerContainer.classList.add('warning');
    } else {
      this.timerContainer.classList.remove('warning');
    }
  }
  
  /**
   * Handle miss event (player lost a heart)
   * @param {Object} data - Miss event data
   */
  handleMiss(data) {
    const heartsRemaining = data.heartsRemaining;
    
    // Update heart display
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < heartsRemaining) {
        this.hearts[i].classList.add('active');
        this.hearts[i].classList.remove('inactive');
      } else {
        this.hearts[i].classList.remove('active');
        this.hearts[i].classList.add('inactive');
      }
    }
    
    // Add shake animation to status bar
    this.container.classList.add('shake');
    setTimeout(() => {
      this.container.classList.remove('shake');
    }, 500);
  }
  
  /**
   * Handle sound button click
   */
  handleSoundToggle() {
    const newSoundSetting = !this.game.settings.sound;
    
    // Update game settings
    this.game.applySettings({
      sound: newSoundSetting
    });
    
    // Update button appearance
    this.updateSoundButton(newSoundSetting);
    
    // Update audio service
    AudioService.setMuted(!newSoundSetting);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners
    this.game.off('tick', this.handleTick);
    this.game.off('miss', this.handleMiss);
    this.soundButton.removeEventListener('click', this.handleSoundToggle);
    
    // Remove from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
