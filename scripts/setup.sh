#!/usr/bin/env bash
# FluxFile - Local Development Setup Script
set -euo pipefail

echo "============================================"
echo "  FluxFile - Local Development Setup"
echo "============================================"
echo ""

# Check prerequisites
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "ERROR: $1 is required but not installed."
    echo "  $2"
    exit 1
  fi
  echo "  [OK] $1 found"
}

echo "Checking prerequisites..."
check_command "node" "Install Node.js 20+ from https://nodejs.org"
check_command "pnpm" "Install pnpm: npm install -g pnpm"
check_command "docker" "Install Docker from https://docker.com"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required (found v$(node -v))"
  exit 1
fi
echo "  [OK] Node.js v$(node -v)"
echo ""

# Install dependencies
echo "Installing dependencies..."
pnpm install
echo ""

# Setup environment files
echo "Setting up environment files..."
if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.example apps/web/.env.local
  echo "  Created apps/web/.env.local (edit with your credentials)"
else
  echo "  apps/web/.env.local already exists, skipping"
fi

if [ ! -f "apps/worker/.env" ]; then
  cp apps/worker/.env.example apps/worker/.env
  echo "  Created apps/worker/.env (edit with your credentials)"
else
  echo "  apps/worker/.env already exists, skipping"
fi
echo ""

# Start Docker services
echo "Starting PostgreSQL and Redis..."
docker-compose -f docker/docker-compose.yml up -d postgres redis
echo ""

# Wait for services to be ready
echo "Waiting for services to be healthy..."
sleep 5

# Setup database
echo "Setting up database..."
pnpm db:generate
pnpm db:migrate
pnpm db:seed
echo ""

echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Edit apps/web/.env.local with your R2 and Resend credentials"
echo "  2. Edit apps/worker/.env with the same R2 credentials"
echo "  3. Run 'pnpm dev' to start the development server"
echo ""
echo "Development accounts (after seed):"
echo "  Admin:      admin@fluxfile.aspekts.dev"
echo "  Free User:  user@example.com"
echo "  Enterprise: enterprise@example.com"
echo ""
echo "URLs:"
echo "  Web App:    http://localhost:3000"
echo "  DB Studio:  pnpm db:studio"
