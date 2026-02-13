#!/bin/bash
# Cloudflare Deployment Setup Script for OmniLog Dashboard

set -e

echo "=========================================="
echo "OmniLog Dashboard - Cloudflare Setup"
echo "=========================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found!"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo "✓ Wrangler CLI found"

# Step 1: Login to Cloudflare
echo ""
echo "Step 1: Authenticating with Cloudflare..."
read -p "Do you want to login to Cloudflare? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler login
fi

# Step 2: Create D1 Database
echo ""
echo "Step 2: Creating D1 Database..."
read -p "Do you want to create a new D1 database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating D1 database 'idealogs_templates'..."
    wrangler d1 create idealogs_templates
    echo ""
    echo "⚠️  IMPORTANT: Copy the database_id and update wrangler.toml"
    echo "See the output above for: database_id = \"...\""
fi

# Step 3: Build the project
echo ""
echo "Step 3: Building project..."
read -p "Do you want to build now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run build
    echo "✓ Build complete"
fi

# Step 4: Initialize database schema
echo ""
echo "Step 4: Database Schema"
echo "After updating wrangler.toml with database_id, run:"
echo "  wrangler d1 execute idealogs_templates --file migrations/0001_init_templates.sql --remote"
echo ""

# Step 5: Deploy
echo ""
echo "Step 5: Deployment"
read -p "Do you want to deploy now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying to Cloudflare Workers..."
    wrangler deploy --env production
    echo "✓ Deployment complete!"
fi

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update yourdomain.com in wrangler.toml with your actual domain"
echo "2. Initialize database: wrangler d1 execute idealogs_templates --file migrations/0001_init_templates.sql --remote"
echo "3. Visit https://yourdomain.com to access your app"
echo ""
echo "For local testing:"
echo "  npm run dev"
echo ""
echo "Documentation:"
echo "  See CLOUDFLARE_DEPLOYMENT.md for detailed instructions"
echo ""
