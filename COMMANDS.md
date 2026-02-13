# 🔧 IdeaLogs Command Reference

Quick reference for all common commands.

## Development

### Start Development Server
```bash
npm run dev
```
Opens: http://localhost:5173/

### Build for Production
```bash
npm run build
```
Creates optimized bundle in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```
Test your production build locally.

---

## Cloud Deployment

### Deploy to Cloudflare Pages (Frontend)
```bash
npm run deploy:pages
```
✅ Builds and deploys your app to Cloudflare Pages
✅ Your app is live at `your-project.pages.dev`

### Deploy Workers (Backend API)
```bash
npm run deploy:workers
```
✅ Deploys API endpoints to Cloudflare Workers
⚠️  Requires `wrangler` CLI

### Initialize Database
```bash
npm run db:init
```
✅ Creates database schema
⚠️  Run after first Workers deployment

---

## Cloudflare Workers

### Setup Wrangler (One-time)
```bash
npm install -g wrangler
wrangler login
```

### Create D1 Database
```bash
wrangler d1 create idealogs
```
💾 Note the database ID from output

### List Databases
```bash
wrangler d1 list
```

### Execute SQL Query
```bash
wrangler d1 execute idealogs --command "SELECT * FROM templates"
```

### Export Database Data
```bash
wrangler d1 execute idealogs --command "SELECT * FROM templates" --json > backup.json
```

### Start Local Workers
```bash
wrangler dev
```
Opens: http://localhost:8787/api/templates

---

## Git & Version Control

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Push to GitHub
```bash
git remote add origin https://github.com/yourusername/idealogs.git
git branch -M main
git push -u origin main
```

### Clone Repository
```bash
git clone https://github.com/yourusername/idealogs.git
cd idealogs
npm install
npm run dev
```

---

## Package Management

### Install All Dependencies
```bash
npm install
```

### Update Dependencies
```bash
npm update
```

### Install Specific Package
```bash
npm install package-name
```

### Uninstall Package
```bash
npm uninstall package-name
```

### Check for Vulnerabilities
```bash
npm audit
npm audit fix
```

---

## Testing & Debugging

### Open Browser DevTools
```
F12  (Windows/Linux)
Cmd + Option + I  (macOS)
```

### View Network Requests
1. Open DevTools (F12)
2. Go to "Network" tab
3. Upload files
4. Check requests and responses

### View Console Logs
1. Open DevTools (F12)
2. Go to "Console" tab
3. See all logs and errors

### Test File Upload
```bash
# Create a test CSV
echo "Time,Value
0,100
1,200" > test.csv

# Then upload in browser
```

---

## Environment Variables

### Create Local Env File
```bash
# Copy example
cp .env.example .env.local

# Edit with your values
# VITE_API_BASE=http://localhost:8787/api
```

### View Current Environment
```bash
npm run dev  # Logs environment info
```

---

## Build Optimization

### Check Bundle Size
```bash
npm run build
# Check dist/ folder size
```

### Analyze Bundle (Optional)
```bash
npm install --save-dev rollup-plugin-visualizer
# Then add to vite.config.ts
```

---

## Troubleshooting Commands

### Clear Node Modules & Reinstall
```bash
rm -r node_modules package-lock.json
npm install
```

### Clear Build Cache
```bash
rm -rf dist
npm run build
```

### Force Fresh Dev Server
```bash
npm run dev -- --force
```

### Check TypeScript Errors
```bash
npx tsc --noEmit
```

### Lint Code (if ESLint configured)
```bash
npm run lint
```

---

## Database Management

### View Database Info
```bash
wrangler d1 info idealogs
```

### Backup Database
```bash
wrangler d1 execute idealogs --command "SELECT * FROM templates" --json > backup.json
```

### Run Migration Script
```bash
wrangler d1 execute idealogs --file workers/migrations/001_init.sql
```

### Query Database Directly
```bash
wrangler d1 execute idealogs --command "SELECT COUNT(*) as count FROM templates"
```

---

## Useful Shortcuts

### Kill Process on Port (if stuck)
```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# On Mac/Linux
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Open in VSCode
```bash
code .  # Opens current directory
```

### Open URL in Default Browser
```bash
# Windows
start http://localhost:5173

# Mac
open http://localhost:5173

# Linux
xdg-open http://localhost:5173
```

---

## Common Command Sequences

### Full Development Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
```

### Full Deployment
```bash
npm install
npm run build
npm run deploy:pages
```

### Full Stack Setup (with Workers)
```bash
npm install
wrangler login
wrangler d1 create idealogs
# Update wrangler.toml with DB ID
npm run deploy:pages
npm run deploy:workers
npm run db:init
```

### Complete Refresh
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
npm run preview
```

---

## Documentation Commands

### View Available Commands
```bash
npm run
```

### Check Versions
```bash
node --version
npm --version
wrangler --version
```

### Get Help
```bash
npm help
wrangler help
wrangler d1 help
```

---

## Performance Tips

### Development
- Use `npm run dev` for hot reload
- DevTools → Performance tab for profiling
- Keep files < 50MB

### Production
- Use `npm run build` for optimization
- Check bundle size: `npm run build`
- Deploy to CDN (Cloudflare Pages)

### Database
- Limit queries with WHERE clause
- Use indexes for frequently accessed columns
- Backup regularly with `wrangler d1 execute`

---

## Keyboard Shortcuts (VS Code)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K Ctrl+O` | Open folder |
| `Ctrl+K Ctrl+R` | Open in explorer |
| `F5` | Start debugging |
| `Ctrl+Shift+D` | Debug panel |
| `Ctrl+Shift+M` | Problems panel |
| `Ctrl+\`` | Toggle terminal |

---

## Useful Links

| Resource | URL |
|----------|-----|
| Node.js | https://nodejs.org |
| npm | https://npmjs.com |
| Vite | https://vitejs.dev |
| React | https://react.dev |
| TypeScript | https://typescriptlang.org |
| Cloudflare | https://cloudflare.com |
| Wrangler CLI | https://developers.cloudflare.com/workers/wrangler |
| D1 Database | https://developers.cloudflare.com/d1 |
| Tailwind CSS | https://tailwindcss.com |

---

## Getting Help

### Check Documentation
```bash
# View project docs
cat INDEX.md              # Documentation index
cat README.md             # Project overview
cat FEATURES.md           # Feature guide
cat SETUP_GUIDE.md        # Setup instructions
```

### Debug Mode
```bash
# Set debug logging
DEBUG=* npm run dev
```

### Check Logs
```bash
npm run dev 2>&1 | tee build.log
```

---

## Quick Copy-Paste Commands

### Setup & Run (First Time)
```bash
npm install && npm run dev
```

### Deploy Frontend
```bash
npm run build && npm run deploy:pages
```

### Deploy Everything
```bash
npm run deploy:pages && npm run deploy:workers && npm run db:init
```

### Backup Data
```bash
wrangler d1 execute idealogs --command "SELECT * FROM templates" --json > templates_backup.json
```

---

**Last Updated:** February 2026

**Version:** 1.0.0
