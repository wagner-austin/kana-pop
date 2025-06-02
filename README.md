# Kana Pop!

A pastel-cozy Japanese kana learning web game built with modern vanilla JavaScript.

## Overview

Kana Pop! is a bubble-popping game designed to help players learn Japanese hiragana and katakana characters. The game features a cute pastel aesthetic, progressive difficulty levels, and spaced repetition learning to help you master Japanese kana in a fun, engaging way.

## Features

- Pure vanilla JavaScript with ES modules - no framework dependencies
- Responsive design that works on mobile and desktop
- Progressive Web App (PWA) support for offline play
- Spaced repetition system that adapts to your learning progress
- Multiple difficulty settings and stage progression
- Sound effects and haptic feedback
- Customizable settings (sound, vibration, kana sets)
- Clean, modular architecture separating game logic from UI

## Getting Started

### Running Locally

You can run the game directly from the file system or using a local server:

```bash
# Option 1: Simple HTTP server (if you have Node.js installed)
npx http-server -o

# Option 2: Using Vite (for development)
npm install
npm run dev
```

### Using Make

A Makefile is included to simplify common operations. If you have Make installed, you can use the following commands:

```bash
# Quick start - simple HTTP server (no build needed)
make run-simple

# Install Node.js dependencies first
make install

# Then start the Vite development server
make run

# Build for production
make build

# Clean build artifacts
make clean
```

> **Important Note**: This project uses Vite.js (a JavaScript build tool), not the Python package named "vite". If you accidentally installed the Python version with `pip install vite`, you should uninstall it with `pip uninstall vite` and use the Node.js version instead.

> **Note for Windows users**: Make is not installed by default on Windows. You can install it via [Chocolatey](https://chocolatey.org/) with `choco install make`, or use the commands directly from the package.json scripts.

### Building for Production

```bash
npm install
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Architecture

The codebase follows a modular architecture:

- `/src/game` - Core game logic components
- `/src/ui` - UI components
- `/src/utils` - Utility functions
- `/styles` - CSS files (tokens, base, layout, components)
- `/assets` - Fonts, audio, and images

The game logic layer never directly manipulates the DOM, communicating via events that UI components subscribe to.

## Development

### Folder Structure

```
kana-pop/
├── assets/
│   ├── audio/
│   │   ├── hiragana/
│   │   ├── katakana/
│   │   └── sfx/
│   ├── fonts/
│   └── images/
│       ├── bubbles/
│       └── icons/
├── src/
│   ├── game/
│   ├── ui/
│   └── utils/
├── styles/
└── index.html
```

### Game Components

- `Game.js` - Main game controller and state machine
- `Bubble.js` - Bubble entity with physics
- `PromptEngine.js` - Kana selection using spaced repetition
- `StageManager.js` - Level progression and difficulty
- `StorageService.js` - Save/load game state and settings
- `AudioService.js` - Sound management
- `HapticsService.js` - Vibration feedback

### UI Components

- `CanvasRenderer.js` - Rendering bubbles to canvas
- `StatusBar.js` - Game HUD with hearts and timer
- `ProgressRibbon.js` - Stage progress indicator
- `SettingsPanel.js` - Settings configuration modal
- `Modal.js` - Reusable modal component

## License

MIT
