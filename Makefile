# Kana Pop! Makefile
# Simplifies common development tasks

# Default port for the development server
PORT ?= 8000

# Default Python command
PYTHON ?= python

# Default Node.js commands - use paths to avoid conflicts with Python packages
NPM ?= npm
NPX ?= npx
NODE_BIN = ./node_modules/.bin

.PHONY: help run run-simple build serve install clean deploy check

# Default target shows help
help:
	@echo "Kana Pop! Make Targets"
	@echo "======================="
	@echo "run          - Start development server with Vite (requires npm install first)"
	@echo "run-simple   - Start simple HTTP server (no build required)"
	@echo "build        - Build for production (requires npm install first)"
	@echo "install      - Install Node.js dependencies"
	@echo "check        - Check if Node.js and npm are installed"
	@echo "clean        - Remove build artifacts"
	@echo "deploy       - Build and prepare for deployment"
	@echo "help         - Show this help message"

# Check for Node.js and npm
check:
	@echo "Checking for Node.js and npm..."
	@powershell.exe -Command "if (Get-Command node -ErrorAction SilentlyContinue) { echo 'Node.js found' } else { echo 'Node.js not found. Please install Node.js first.' }"
	@powershell.exe -Command "if (Get-Command npm -ErrorAction SilentlyContinue) { echo 'npm found' } else { echo 'npm not found. Please install npm first.' }"

# Start development server with Vite
run: check
	@echo "Starting Vite development server..."
	powershell.exe -Command "$$errorActionPreference = 'Stop'; try { $(NPX) vite } catch { echo \"Error: Vite failed. Run 'make install' first.\" } finally { exit 0 }"

# Start a simple HTTP server (no build needed)
run-simple:
	@echo "Starting simple HTTP server on port $(PORT)..."
	powershell.exe -Command "$$errorActionPreference = 'Stop'; try { $(PYTHON) -m http.server $(PORT) } catch { echo \"HTTP server error\" } finally { exit 0 }"

# Alias for run-simple for backward compatibility
serve: run-simple

# Build for production
build: check
	@echo "Building for production..."
	$(NPX) vite build || $(NODE_BIN)/vite build || echo "Error: Vite not found. Run 'make install' first."

# Install dependencies
install: check
	@echo "Installing Node.js dependencies..."
	$(NPM) install

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	if exist dist rmdir /s /q dist
	if exist node_modules rmdir /s /q node_modules

# Build and prepare for deployment
deploy: build
	@echo "Built for deployment"
	@echo "Files ready in ./dist"
