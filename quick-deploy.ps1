#!/usr/bin/env pwsh
# OmniLog Dashboard - Quick Deploy Script

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     OmniLog Dashboard - Quick Cloudflare Deployment            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for Cloudflare setup
$wranglerCheck = Get-Command wrangler -ErrorAction SilentlyContinue
if ($null -eq $wranglerCheck) {
    Write-Host "❌ Wrangler not found!" -ForegroundColor Red
    Write-Host "Install: npm install -g wrangler" -ForegroundColor Yellow
    Write-Host "Then authenticate: wrangler login" -ForegroundColor Yellow
    exit 1
}

# Step 1: Check if wrangler.toml is configured
Write-Host "Step 1: Checking configuration..." -ForegroundColor Yellow
$wranglerContent = Get-Content wrangler.toml -Raw
if ($wranglerContent -match 'database_id = ""') {
    Write-Host "❌ database_id not configured in wrangler.toml" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create D1 database first:" -ForegroundColor Cyan
    Write-Host "  wrangler d1 create idealogs_templates" -ForegroundColor White
    Write-Host ""
    Write-Host "Then update wrangler.toml with the database_id" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if ($wranglerContent -match 'yourdomain.com') {
    Write-Host "❌ Domain not configured - replace 'yourdomain.com' in wrangler.toml" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ Configuration looks good" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy
Write-Host "Step 2: Deploying to Cloudflare Workers..." -ForegroundColor Yellow
Write-Host ""
wrangler deploy --env production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 3: Initializing database..." -ForegroundColor Yellow
    Write-Host ""
    
    wrangler d1 execute idealogs_templates --remote --file migrations/0001_init_templates.sql --env production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          🎉 DEPLOYMENT COMPLETE! 🎉                           ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your app is live! Visit:" -ForegroundColor Green
        Write-Host "  https://yourdomain.com" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Update your domain in browser"
        Write-Host "  2. Test the app"
        Write-Host "  3. Create templates"
        Write-Host "  4. Monitor: wrangler tail --env production"
        Write-Host ""
    } else {
        Write-Host "⚠️  Database initialization had issues" -ForegroundColor Yellow
        Write-Host "You can retry: wrangler d1 execute idealogs_templates --remote --file migrations/0001_init_templates.sql --env production" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Check errors above and retry" -ForegroundColor Yellow
    exit 1
}
