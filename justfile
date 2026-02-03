# justfile for positivehelp
# Run `just` to see available commands

# Load .env file for environment variables
set dotenv-load := true

# Use POSIX-compatible shell
set shell := ["sh", "-c"]

# Default recipe: show help
default:
    @just --list --unsorted

# ─────────────────────────────────────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────────────────────────────────────

# Install dependencies
install:
    pnpm install

# Alias for install
bootstrap: install

# Start development server with Turbopack
dev:
    pnpm run dev

# Build for production
build:
    pnpm run build

# Start production server (runs migrations first)
start:
    pnpm run start

# ─────────────────────────────────────────────────────────────────────────────
# Code Quality
# ─────────────────────────────────────────────────────────────────────────────

# Run linter (Next.js ESLint)
lint:
    pnpm run lint

# Format code with Biome
format:
    @echo "Formatting code with Biome..."
    pnpm exec biome format --write .

# Check formatting without modifying files
format-check:
    pnpm exec biome format .

# Lint with Biome (stricter than Next.js lint)
biome-lint:
    pnpm exec biome lint .

# Run all Biome checks (lint + format)
biome-check:
    pnpm exec biome check .

# Run all Biome checks and apply safe fixes
biome-fix:
    pnpm exec biome check --write .

# Type-check a specific file (using Bun for speed)
typecheck file:
    pnpm run bun-tsc {{ file }}

# Type-check a specific file (using Node)
typecheck-node file:
    pnpm run node-tsc {{ file }}

# ─────────────────────────────────────────────────────────────────────────────
# Testing
# ─────────────────────────────────────────────────────────────────────────────

# Run tests
test:
    pnpm run test

# Run tests in watch mode
test-watch:
    pnpm run test:watch

# Run tests with coverage
test-coverage:
    pnpm exec jest --coverage

# ─────────────────────────────────────────────────────────────────────────────
# Database (Drizzle + Turso)
# ─────────────────────────────────────────────────────────────────────────────

# Generate new migration after schema changes
db-generate:
    pnpm run db:generate

# Apply migrations to database
db-migrate:
    pnpm run db:migrate

# Reset database to latest migration (DESTRUCTIVE)
db-reset:
    @echo "⚠️  This will reset the database. Press Ctrl+C to cancel."
    @sleep 2
    pnpm run db:reset

# ─────────────────────────────────────────────────────────────────────────────
# Docker
# ─────────────────────────────────────────────────────────────────────────────

# Docker compose file
compose_file := "docker-compose.yml"

# Build Docker image
docker-build:
    docker compose -f {{ compose_file }} build

# Start containers in foreground
docker-up:
    docker compose -f {{ compose_file }} up

# Start containers in background
docker-up-detached:
    docker compose -f {{ compose_file }} up -d

# Stop and remove containers
docker-down:
    docker compose -f {{ compose_file }} down

# View container logs
docker-logs:
    docker compose -f {{ compose_file }} logs -f

# Rebuild and start containers
docker-rebuild:
    docker compose -f {{ compose_file }} up --build

# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

# Remove build artifacts and caches
clean:
    @echo "Cleaning build artifacts..."
    rm -rf .next
    rm -rf node_modules/.cache
    @echo "✓ Clean complete"

# Deep clean (removes node_modules too)
clean-all: clean
    @echo "Removing node_modules..."
    rm -rf node_modules
    @echo "✓ Deep clean complete. Run 'just install' to reinstall."

# Delete a message by ID
delete-message id:
    pnpm run delete-message {{ id }}

# Run a quality check before committing (lint + test)
pre-commit: lint test
    @echo "✓ Pre-commit checks passed"

# Full CI check (format-check + lint + test + build)
ci: format-check lint test build
    @echo "✓ All CI checks passed"
