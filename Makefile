.PHONY: help install run serve dev preview lint clean test test-watch test-coverage savecode savecode-test

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
	@echo "  lint                  Perform type checking, format code, and fix lint issues."
	@echo "  clean                 Remove common build artifacts (e.g., 'dist', 'docs' folders,"
	@echo "                        .parcel-cache, .tsbuildinfo)."
	@echo "                        Uses 'npx rimraf' for cross-platform compatibility."
	@echo "  test                  Run all tests once using Vitest."
	@echo "  test-watch            Run tests in watch mode."
	@echo "  test-coverage         Generate a test coverage report."
	@echo "  savecode              Run the 'savecode' utility to capture current codebase state (skips 'test' dir)."
	@echo "  savecode-test         Run 'savecode' utility including the 'test' directory."
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

# Linting, Formatting & Type Checking
lint:
	@echo "🧐 Performing type checking..."
	pnpm type-check
	@echo "✅ Type checking complete."
	@echo "💅 Formatting codebase..."
	pnpm format
	@echo "✅ Formatting complete."
	@echo "🔍 Linting and fixing codebase..."
	pnpm lint --fix
	@echo "✅ Linting and fixing complete."
	@echo "👍 All checks (types, formatting & lint) passed."

# Cleaning
# Removes common build/cache folders.
clean:
	@echo "🧹 Cleaning project artifacts..."
	npx rimraf docs dist .parcel-cache .tsbuildinfo
	@echo "✅ Cleaned 'docs', 'dist', '.parcel-cache', '.tsbuildinfo' (if they existed)."

# Testing
test:
	@echo "🧪 Running tests..."
	pnpm test
	@echo "✅ Tests complete."

test-watch:
	@echo "👀 Running tests in watch mode..."
	pnpm test:watch

test-coverage:
	@echo "📊 Generating test coverage report..."
	pnpm test:coverage
	@echo "✅ Coverage report generated in ./coverage/. Open ./coverage/index.html to view."

# Save code utility
savecode:
	@echo "💾 Running savecode utility..."
	savecode . --skip test docs .\.vscode\ .\node_modules\ --ext ts html yml webmanifest css
	@echo "✅ Code saved (skipped test dir)."

# Save code utility (including test directory)
savecode-test:
	@echo "💾 Running savecode utility (including test dir)..."
	savecode . --skip docs .\.vscode\ .\node_modules\ --ext ts html yml webmanifest css json
	@echo "✅ Code saved (included test dir)."

# Set default goal to 'help' so running 'make' without arguments shows the help message.
.DEFAULT_GOAL := help
