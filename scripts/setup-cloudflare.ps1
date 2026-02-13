# Cloudflare Deployment Setup Script for OmniLog Dashboard (Windows)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OmniLog Dashboard - Cloudflare Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if wrangler is installed
$wranglerCheck = Get-Command wrangler -ErrorAction SilentlyContinue
if ($null -eq $wranglerCheck) {
    Write-Host "❌ Wrangler CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Wrangler CLI found" -ForegroundColor Green

# Step 1: Login to Cloudflare
Write-Host ""
Write-Host "Step 1: Authenticating with Cloudflare..." -ForegroundColor Cyan
$loginChoice = Read-Host "Do you want to login to Cloudflare? (y/n)"
if ($loginChoice -eq 'y' -or $loginChoice -eq 'Y') {
    wrangler login
}

# Step 2: Create D1 Database
Write-Host ""
Write-Host "Step 2: Creating D1 Database..." -ForegroundColor Cyan
$dbChoice = Read-Host "Do you want to create a new D1 database? (y/n)"
if ($dbChoice -eq 'y' -or $dbChoice -eq 'Y') {
    Write-Host "Creating D1 database 'idealogs_templates'..." -ForegroundColor Yellow
    wrangler d1 create idealogs_templates
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Copy the database_id and update wrangler.toml" -ForegroundColor Yellow
    Write-Host "See the output above for: database_id = `"...`"" -ForegroundColor Yellow
}

# Step 3: Build the project
Write-Host ""
Write-Host "Step 3: Building project..." -ForegroundColor Cyan
$buildChoice = Read-Host "Do you want to build now? (y/n)"
if ($buildChoice -eq 'y' -or $buildChoice -eq 'Y') {
    npm run build
    Write-Host "✓ Build complete" -ForegroundColor Green
}

# Step 4: Initialize database schema
Write-Host ""
Write-Host "Step 4: Database Schema" -ForegroundColor Cyan
Write-Host "After updating wrangler.toml with database_id, run:" -ForegroundColor Yellow
Write-Host "  wrangler d1 execute idealogs_templates --file migrations/0001_init_templates.sql --remote" -ForegroundColor Yellow
Write-Host ""

# Step 5: Deploy
Write-Host ""
Write-Host "Step 5: Deployment" -ForegroundColor Cyan
$deployChoice = Read-Host "Do you want to deploy now? (y/n)"
if ($deployChoice -eq 'y' -or $deployChoice -eq 'Y') {
    Write-Host "Deploying to Cloudflare Workers..." -ForegroundColor Yellow
    wrangler deploy --env production
    Write-Host "✓ Deployment complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update yourdomain.com in wrangler.toml with your actual domain"
Write-Host "2. Initialize database: wrangler d1 execute idealogs_templates --file migrations/0001_init_templates.sql --remote"
Write-Host "3. Visit https://yourdomain.com to access your app"
Write-Host ""
Write-Host "For local testing:" -ForegroundColor Yellow
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  See CLOUDFLARE_DEPLOYMENT.md for detailed instructions"
Write-Host ""
