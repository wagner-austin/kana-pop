/**
 * main.js
 * Entry point for the Kana Pop! game
 */

import { Game } from './game/Game.js';
import { CanvasRenderer } from './ui/CanvasRenderer.js';
import { StatusBar } from './ui/StatusBar.js';
import { ProgressRibbon } from './ui/ProgressRibbon.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import * as Storage from './game/StorageService.js';
import { registerSW } from './utils/sw.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get root element
  const root = document.getElementById('app');
  
  // Load saved settings or use defaults
  const settings = Storage.loadSettings();
  
  // Create UI components
  const renderer = new CanvasRenderer(root);
  const progressRibbon = new ProgressRibbon(root);
  
  // Create game instance
  const game = new Game(renderer, settings);
  
  // Create UI components that need game reference
  const statusBar = new StatusBar(root, game);
  const settingsPanel = new SettingsPanel(root, settings);
  
  // Set up event listeners
  game.on('tick', data => {
    progressRibbon.update(data.progress);
  });
  
  game.on('gameover', data => {
    // Show settings panel when game ends
    setTimeout(() => settingsPanel.open(), 1500);
  });
  
  settingsPanel.on('settingsChanged', newSettings => {
    game.applySettings(newSettings);
  });
  
  // Show settings on first load, then start game when closed
  settingsPanel.open();
  settingsPanel.on('modalClosed', () => {
    // Small delay to allow modal animation to complete
    setTimeout(() => game.start(), 300);
  });
  
  // Register service worker for PWA support
  registerSW();
  
  // Expose to window for debugging (can be removed for production)
  window.gameApp = { game, renderer, statusBar, settingsPanel };
});
