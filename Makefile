# Variables
BACKEND_DIR=backend
FRONTEND_DIR=frontend
BINARY_NAME=k8s-monitor

# Default target
dev: dev-frontend dev-backend

# Development - start both frontend and backend
dev-frontend:
	@echo "Starting frontend development server..."
	cd $(FRONTEND_DIR) && npm run dev &

dev-backend:
	@echo "Starting backend development server..."
	cd $(BACKEND_DIR) && air

# Build - compile both parts
build: build-frontend build-backend

build-frontend:
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm install && npm run build

build-backend:
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go build -o bin/$(BINARY_NAME) cmd/server/main.go

# Test - run all tests
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd $(BACKEND_DIR) && go test ./...

test-frontend:
	@echo "Running frontend tests..."
	cd $(FRONTEND_DIR) && npm test -- --watchAll=false

# Install dependencies and tools
install: 
	@echo "Installing dependencies..."
	$(MAKE) install-frontend
	$(MAKE) install-backend
	$(MAKE) install-air

install-frontend:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install

install-backend:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && go mod tidy

install-air:
	@echo "Installing Air for hot reload..."
	go install github.com/cosmtrek/air@latest

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BACKEND_DIR)/bin/
	rm -rf $(FRONTEND_DIR)/dist/
	rm -rf $(FRONTEND_DIR)/node_modules/

# Help
help:
	@echo "Available targets:"
	@echo "  dev     - Start development servers"
	@echo "  build   - Build both frontend and backend"
	@echo "  test    - Run all tests"
	@echo "  install - Install dependencies"
	@echo "  clean   - Clean build artifacts"

# Declare phony targets
.PHONY: dev dev-frontend dev-backend build build-frontend build-backend test test-backend test-frontend install clean help