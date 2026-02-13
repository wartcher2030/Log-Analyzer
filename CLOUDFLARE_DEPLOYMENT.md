# IdeaLogs Cloudflare Workers Deployment Guide

This guide helps you deploy IdeaLogs with Cloudflare Workers and R1 database for template persistence.

## Prerequisites

1. **Cloudflare Account** - Free or paid tier
2. **Wrangler CLI** - Install via: `npm install -g wrangler`
3. **Node.js** - v18 or higher
4. **Git** - For version control

## Architecture Overview

```
┌─────────────────┐
│  IdeaLogs App   │  (React + Vite)
│  (Frontend)     │  Deployed on Cloudflare Pages
└────────┬────────┘
         │
         │ API Calls
         │
┌────────v────────┐
│ Cloudflare      │  (Workers)
│ Workers         │  Handles template CRUD
└────────┬────────┘
         │
         │ SQL
         │
┌────────v────────┐
│ Cloudflare D1   │  (R1 Database)
│ (SQLite DB)     │  Stores templates
└─────────────────┘
```

## Step 1: Setup Cloudflare Account & Get API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Account Settings → API Tokens**
3. Create a token with these scopes:
   - `Account.Workers KV Storage`
   - `Account.Workers Scripts`
   - `D1.Database.Read`
   - `D1.Database.Write`
4. Copy the token (you'll need it for authentication)

## Step 2: Create D1 Database

```bash
# Login to Cloudflare
wrangler login

# Create new D1 database
wrangler d1 create idealogs

# Note: Save the database_id from output
```

## Step 3: Setup Wrangler Configuration

Update `wrangler.toml`:

```toml
name = "idealogs-api"
main = "workers/src/index.ts"
type = "service"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "api.yourdomain.com/api/*", zone_id = "your-zone-id" }
]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "idealogs"
database_id = "your-database-id-here"  # <-- Replace with actual ID

[build]
command = "npm run build:workers"
cwd = "."

[build.upload]
format = "modules"
main = "dist/workers/index.js"
```

## Step 4: Setup Environment Variables

Create `.env.production`:

```
VITE_API_BASE=https://api.yourdomain.com/api
```

For local development, create `.env.local`:

```
VITE_API_BASE=http://localhost:8787/api
```

## Step 5: Build and Deploy

### Option A: Deploy to Cloudflare Pages (Frontend)

```bash
# Build the project
npm run build

# Deploy to Pages using Wrangler
wrangler pages deploy dist

# Or push to GitHub and enable auto-deploy in Cloudflare Pages UI
```

### Option B: Deploy Workers (Backend)

```bash
# Build workers
npm run build:workers

# Deploy workers
wrangler deploy --name idealogs-api

# Initialize database
wrangler d1 execute idealogs --file workers/migrations/001_init.sql
```

## Step 6: Configure Custom Domain (Optional)

1. Go to Cloudflare Pages/Workers dashboard
2. Add custom domain: `api.yourdomain.com`
3. Update DNS records if needed
4. Update `VITE_API_BASE` environment variable

## Step 7: Database Initialization

The database schema is automatically created on first API call. To manually initialize:

```bash
# Create migration file
cat > workers/migrations/001_init.sql << 'EOF'
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  xAxis TEXT NOT NULL,
  yAxes TEXT NOT NULL,
  chartType TEXT DEFAULT 'line',
  strokeWidth INTEGER DEFAULT 2,
  showGrid INTEGER DEFAULT 1,
  showMinorGrid INTEGER DEFAULT 0,
  xMin TEXT,
  xMax TEXT,
  yMin REAL,
  yMax REAL,
  xAxisLabel TEXT,
  yAxisLabel TEXT,
  xAxisType TEXT DEFAULT 'number',
  sourceLogId TEXT,
  savedAt TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_createdAt ON templates(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_templates_sourceLogId ON templates(sourceLogId);
EOF

# Execute migration
wrangler d1 execute idealogs --file workers/migrations/001_init.sql
```

## Development Setup

### Local Testing

```bash
# Install dependencies
npm install

# Install Wrangler locally
npm install --save-dev wrangler

# Start local development server
npm run dev

# In another terminal, start Workers locally
npm run workers:dev

# Your app runs at http://localhost:5173
# Workers API at http://localhost:8787
```

### Environment Variables for Dev

Create `.env.local`:
```
VITE_API_BASE=http://localhost:8787/api
```

## API Endpoints

Once deployed, the following endpoints are available:

### List Templates
```bash
GET /api/templates
```

### Get Single Template
```bash
GET /api/templates/:id
```

### Create Template
```bash
POST /api/templates
Content-Type: application/json

{
  "id": "unique-id",
  "name": "Template Name",
  "title": "Chart Title",
  "xAxis": "X Column",
  "yAxes": ["Y1", "Y2"],
  ...
}
```

### Update Template
```bash
PUT /api/templates/:id
Content-Type: application/json

{...template data...}
```

### Delete Template
```bash
DELETE /api/templates/:id
```

## Fallback Behavior

- **Offline Mode**: Templates are saved to browser localStorage if database is unavailable
- **Local Only**: Without Workers setup, all data persists in browser storage only
- **Auto Sync**: When online, local changes sync to database

## Performance Optimization

- Frontend bundle size: ~150KB (gzipped)
- Database queries cached in browser for 5 minutes
- Images and files stored in Cloudflare R2 (optional)
- Static assets served via Cloudflare CDN

## Monitoring & Logs

```bash
# View Workers logs
wrangler tail

# View database usage
wrangler d1 info idealogs

# Export data
wrangler d1 execute idealogs --command "SELECT * FROM templates" --json
```

## Troubleshooting

### Templates not saving?
- Check browser console for API errors
- Verify `VITE_API_BASE` environment variable
- Ensure database binding is correct in wrangler.toml

### CORS errors?
- The API includes CORS headers for all origins
- Verify requests include proper Content-Type headers

### Database quota exceeded?
- Cloudflare free tier includes 5GB storage
- Monitor usage: `wrangler d1 info idealogs`

## Free Tier Limits

| Feature | Free Tier Limit |
|---------|-----------------|
| Workers CPU time | 30M requests/day |
| D1 Database | 3 databases, 5GB total |
| Cloudflare Pages | 500 builds/month |
| Bandwidth | Unlimited |

## Next Steps

1. Deploy frontend to Cloudflare Pages
2. Deploy backend to Cloudflare Workers
3. Test template CRUD operations
4. Setup custom domain
5. Enable analytics in Cloudflare dashboard

## Support

- [Wrangler Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
