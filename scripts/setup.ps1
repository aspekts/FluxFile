# FluxFile - Local Development Setup Script (PowerShell)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FluxFile - Local Development Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Test-Command($command, $installHint) {
    if (Get-Command $command -ErrorAction SilentlyContinue) {
        Write-Host "  [OK] $command found" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  [MISSING] $command - $installHint" -ForegroundColor Red
        return $false
    }
}

Write-Host "Checking prerequisites..."
$allGood = $true
$allGood = (Test-Command "node" "Install Node.js 20+ from https://nodejs.org") -and $allGood
$allGood = (Test-Command "pnpm" "Install pnpm: npm install -g pnpm") -and $allGood
$allGood = (Test-Command "docker" "Install Docker from https://docker.com") -and $allGood

if (-not $allGood) {
    Write-Host "`nPlease install missing prerequisites and try again." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 20) {
    Write-Host "ERROR: Node.js 20+ is required (found v$(node -v))" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Node.js $(node -v)" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install
Write-Host ""

# Setup environment files
Write-Host "Setting up environment files..." -ForegroundColor Yellow
if (-not (Test-Path "apps/web/.env.local")) {
    Copy-Item "apps/web/.env.example" "apps/web/.env.local"
    Write-Host "  Created apps/web/.env.local (edit with your credentials)"
} else {
    Write-Host "  apps/web/.env.local already exists, skipping"
}

if (-not (Test-Path "apps/worker/.env")) {
    Copy-Item "apps/worker/.env.example" "apps/worker/.env"
    Write-Host "  Created apps/worker/.env (edit with your credentials)"
} else {
    Write-Host "  apps/worker/.env already exists, skipping"
}
Write-Host ""

# Start Docker services
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml up -d postgres redis
Write-Host ""

# Wait for services to be ready
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Setup database
Write-Host "Setting up database..." -ForegroundColor Yellow
pnpm db:generate
pnpm db:migrate
pnpm db:seed
Write-Host ""

Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit apps/web/.env.local with your R2 and Resend credentials"
Write-Host "  2. Edit apps/worker/.env with the same R2 credentials"
Write-Host "  3. Run 'pnpm dev' to start the development server"
Write-Host ""
Write-Host "Development accounts (after seed):"
Write-Host "  Admin:      admin@fluxfile.aspekts.dev"
Write-Host "  Free User:  user@example.com"
Write-Host "  Enterprise: enterprise@example.com"
Write-Host ""
Write-Host "URLs:"
Write-Host "  Web App:    http://localhost:3000"
Write-Host "  DB Studio:  pnpm db:studio"
