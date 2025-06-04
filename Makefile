.PHONY: help install run serve dev preview lint clean

# Default target: list available commands
help:
	@echo "---------------------------------------------------------------------"
	@echo "Makefile for Kana Pop"
	@echo "---------------------------------------------------------------------"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help                  Show this help message."
	@echo "  install               Install project dependencies using pnpm."
	@echo "  run (or serve, dev)   Run the application locally on http://localhost:8080"
	@echo "                        and open it in your default browser."
	@echo "  preview               Preview the application as it might appear on"
	@echo "                        GitHub Pages, serving from http://localhost:8081."
	@echo "                        Ensures relative paths are working."
	@echo "  lint                  Lint the TypeScript and JavaScript codebase."
	@echo "  clean                 Remove common build artifacts (e.g., 'dist', 'docs' folders,"
	@echo "                        .parcel-cache, .tsbuildinfo)."
	@echo "                        Uses 'npx rimraf' for cross-platform compatibility."
	@echo "---------------------------------------------------------------------"

# Install dependencies
install:
	@echo "📦 Installing project dependencies..."
	pnpm install
	@echo "✅ Dependencies installed."

# Development server
run: dev
serve: dev
dev:
	@echo "🚀 Starting local development server..."
	pnpm dev
	@echo "✅ Vite dev server is running. Check your terminal for the correct URL (usually http://localhost:5173). Press Ctrl+C to stop."

# GitHub Pages preview
# Builds the app and serves the 'docs' folder for preview.
preview:
	@echo "🔎 Building for production and starting preview server..."
	pnpm build
	pnpm preview --port 8081
	@echo "✅ Preview available (usually http://localhost:8081). Press Ctrl+C to stop."

# Linting
lint:
	@echo "🔍 Linting codebase..."
	pnpm run lint
	@echo "✅ Linting complete."

# Cleaning
# Removes common build/cache folders.
clean:
	@echo "🧹 Cleaning project artifacts..."
	npx rimraf docs dist .parcel-cache .tsbuildinfo
	@echo "✅ Cleaned 'docs', 'dist', '.parcel-cache', '.tsbuildinfo' (if they existed)."

# Set default goal to 'help' so running 'make' without arguments shows the help message.
.DEFAULT_GOAL := help
