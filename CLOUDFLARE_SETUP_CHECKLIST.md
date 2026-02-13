# Cloudflare Deployment Checklist

## Pre-Deployment Requirements

- [ ] Cloudflare account created (free or paid)
- [ ] Domain registered and pointed to Cloudflare nameservers
- [ ] Wrangler CLI installed globally: `npm install -g wrangler`
- [ ] Node.js v18+ installed
- [ ] Git for version control

## Step 1: Install & Authenticate

### 1.1 Install Wrangler (if not already installed)
```bash
npm install -g wrangler
wrangler update
```

### 1.2 Authenticate with Cloudflare
```bash
wrangler login
# This opens a browser to authenticate
```

**Status**: [ ] Complete

## Step 2: Create D1 Database

### 2.1 Create Database
```bash
wrangler d1 create idealogs_templates
```

### 2.2 Save Database ID
When the command completes, you'll see:
```
Successfully created DB "idealogs_templates"
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Copy and save this ID** - you'll need it in the next step.

**Status**: [ ] Complete

## Step 3: Configure wrangler.toml

### 3.1 Update Database ID
Edit `wrangler.toml` and find this section:
```toml
[[d1_databases]]
binding = "DB"
database_name = "idealogs_templates"
database_id = ""    # <-- Add your ID here
```

Paste your database ID:
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3.2 Configure Domain (Production)
If you have a domain, update:
```toml
[env.production]
routes = [
  { pattern = "yourdomain.com/api/*", zone_name = "yourdomain.com" },
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
vars = { 
  ENVIRONMENT = "production",
  VITE_API_BASE = "https://yourdomain.com/api"
}
```

Replace `yourdomain.com` with your actual domain.

**Status**: [ ] Complete

## Step 4: Initialize Database Schema

### 4.1 Create Initial Tables
```bash
# For local development
wrangler d1 execute idealogs_templates --local < migrations/0001_init_templates.sql

# For production (after deployment)
wrangler d1 execute idealogs_templates --remote < migrations/0001_init_templates.sql --env production
```

This will create:
- `templates` table with schema
- Default templates (Altitude Stability, Attitude Stability)
- Indexes for performance

**Status**: [ ] Complete

## Step 5: Build Project

### 5.1 Install Dependencies
```bash
npm install
```

### 5.2 Run Production Build
```bash
npm run build
```

Expected output:
```
✓ 928 modules transformed
✓ built in 7.81s
```

Files created:
- `dist/` - React app (static files)
- `workers/dist/` - Worker API

**Status**: [ ] Complete

## Step 6: Deploy to Cloudflare

### 6.1 Deploy Workers + App
```bash
wrangler deploy --env production
```

This deploys:
- Cloudflare Worker (API backend)
- D1 Database (template storage)
- Static site hosting (React app)

### 6.2 Verify Deployment
URL format: `https://yourdomain.com` or `https://workers-project-name.pages.dev`

**Status**: [ ] Complete

## Step 7: Test Deployment

### 7.1 Check Frontend
```bash
curl https://yourdomain.com
# Should return HTML of React app
```

### 7.2 Check API
```bash
curl https://yourdomain.com/api/templates
# Should return JSON array of templates
```

### 7.3 Test Create Template
```bash
curl -X POST https://yourdomain.com/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "name": "Test Template",
    "title": "Test",
    "xAxis": "Time",
    "yAxes": ["Value"],
    "chartType": "line",
    "strokeWidth": 2,
    "showGrid": true,
    "savedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
# Should return the template with status 201
```

**Status**: [ ] Complete

## Step 8: Monitor & Verify

### 8.1 Check Worker Logs
```bash
wrangler tail --env production
```

This shows real-time logs from your deployed worker.

### 8.2 Verify Database
```bash
wrangler d1 execute idealogs_templates --remote --command "SELECT COUNT(*) as template_count FROM templates;"
```

Should show count of templates.

**Status**: [ ] Complete

## Step 9: Set Up Custom Domain (Optional)

### 9.1 Add Custom Domain
1. Go to Cloudflare Dashboard
2. Select your domain
3. Go to Workers → Routes
4. Click "Add Route"
5. Pattern: `yourdomain.com/*`
6. Service: Your deployed worker

### 9.2 Enable SSL/TLS
- Cloudflare automatically provides SSL/TLS
- Certificate is issued automatically
- Auto-renewal enabled

**Status**: [ ] Complete

## Step 10: Configure Analytics & Monitoring

### 10.1 Enable Google Analytics (Optional)
1. Get Google Analytics ID
2. Add to `index.html`
3. Redeploy

### 10.2 Setup Error Alerts
1. Go to Cloudflare Dashboard
2. Analytics → Logs
3. Create alerts for failed requests

### 10.3 Monitor Usage
```bash
wrangler d1 info idealogs_templates
```

Shows:
- Database size
- Query performance
- Storage used

**Status**: [ ] Complete

## Troubleshooting Checklist

### Issue: Database not found
- [ ] Verify database_id in wrangler.toml is correct
- [ ] Check database exists: `wrangler d1 list`
- [ ] Recreate if needed: `wrangler d1 create idealogs_templates`

### Issue: API returns 500
- [ ] Check logs: `wrangler tail --env production`
- [ ] Verify D1 binding is correct
- [ ] Check database initialization ran

### Issue: CORS errors
- [ ] CORS headers are configured in Worker
- [ ] Verify `VITE_API_BASE` matches deployed URL
- [ ] Check browser console for exact error

### Issue: Templates not persisting
- [ ] Check database schema created: `wrangler d1 execute ... --command "SELECT name FROM sqlite_master WHERE type='table';"`
- [ ] Verify API responses are 2xx status
- [ ] Check browser storage (localStorage as fallback)

### Issue: Worker timeout
- [ ] Check query complexity
- [ ] Verify database is responsive
- [ ] Check Wrangler logs for errors

## Performance Tuning

### Database Indexes
Already created in migration:
- `idx_templates_createdAt` - for listing
- `idx_templates_sourceLogId` - for filtering
- `idx_templates_updated` - for sync

### Caching
- Set cache headers for static assets: 1 year
- API responses: no-cache (always fresh)
- Worker execution: <100ms for cache hits

### Bundle Size
```
Current: 468 KB gzipped
- Recharts: 94 KB
- Vendor: 352 KB
- App code: 15 KB
- HTML/CSS: 7 KB
```

## Rollback Plan

If deployment fails:

```bash
# Revert to previous version
wrangler rollback --env production

# Or redeploy from git
git checkout <previous-commit>
npm run build
wrangler deploy --env production
```

## Cost Estimate (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Workers | 100K requests/day | Free |
| D1 Database | 5 GB storage | Free |
| Bandwidth | Unlimited | Free |
| Custom domain | Yes | Free |
| SSL/TLS | Yes | Free |

**Total Monthly Cost**: $0 (on free tier)

## Success Indicators

✅ Deployment is successful when:
- [ ] Frontend loads at `https://yourdomain.com`
- [ ] All controls are interactive
- [ ] Can create templates in Standardization Lab
- [ ] Templates persist after browser refresh
- [ ] Templates sync via API (not just localStorage)
- [ ] No console errors
- [ ] All export functions work

## Maintenance

### Weekly
- Check Wrangler logs for errors
- Monitor API response times

### Monthly
- Review database size
- Check analytics
- Update dependencies if needed

### When Needed
- Add new columns to database (migrations)
- Optimize slow queries
- Add new features

## Next Steps

1. **Setup monitoring**: Configure error alerts
2. **Enable analytics**: Track user behavior
3. **Backup data**: Schedule regular exports
4. **Document API**: Create API documentation for frontend team
5. **Plan upgrades**: Consider paid tier if limits exceeded

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Deployment Troubleshooting](https://developers.cloudflare.com/workers/troubleshooting/)

---

**Last Updated**: February 13, 2026
**Status**: Ready for Production Deployment ✓
