# 📖 Quick Deployment Reference

## One-Command Deployment

### Cloudflare Pages
```bash
npm run build
# Then upload dist/ folder via Cloudflare Dashboard
# OR use Wrangler CLI: wrangler pages deploy dist/
```

### Vercel
```bash
# Install & login
npm i -g vercel
vercel login

# Deploy
vercel
```

### GitHub Pages
```bash
# Build
npm run build

# Push dist/ to gh-pages branch
git add dist/
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

---

## Quick Health Check

```bash
# Full verification (run these in order)
npm run type-check      # TypeScript check
npm run build           # Production build
npm run preview         # Start preview server
# Then visit http://localhost:4173
# Test: Upload CSV → Chart renders → Export works
```

---

## Environment Variables

Copy to `.env.production` on deployment platform:
```
VITE_MAX_UPLOAD_SIZE_MB=50
VITE_MAX_ROWS_PER_FILE=5000000
VITE_CHART_MAX_POINTS=10000
VITE_ENABLE_OFFLINE_MODE=true
```

---

## Build Output Overview

```
dist/
├── index.html (3.74 kB)                    ← Entry point
├── assets/
│   ├── vendor-react-*.js (1.1 MB gzip)     ← React + React-DOM
│   ├── vendor-recharts-*.js (94 kB gzip)   ← Chart library
│   ├── vendor-html-to-image-*.js (5 kB)    ← Export support
│   └── index-*.js (14.6 kB gzip)           ← App logic
└── service-worker.js                        ← Offline support
```

**Total: ~466 kB gzipped** (Excellent for full React app with charts!)

---

## Performance Tips

1. **Enable Gzip compression** on your host (99% of servers do this automatically)
2. **Set cache headers** on assets (1 year for `/assets/*`)
3. **Keep service worker cache clean** (auto-managed by our implementation)
4. **Test on slow 3G** (DevTools → Network throttling)

---

## Testing After Deployment

1. Open app in incognito window (fresh cache)
2. Upload CSV file with ~1000 rows
3. Verify chart renders smoothly
4. Test export to PDF
5. Open DevTools → Storage → Service Workers (should show installed)
6. Go offline (`DevTools → Network → Offline`) and refresh
   - App should still be accessible with cached data

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Service worker not updating | Increment version in `public/service-worker.js` |
| Chart chunk failing to load | Check CORS headers, ensure all `/assets/*` are accessible |
| Large bundle warning | Already optimized - React is inherently ~350 kB |
| Build command fails | Run `npm clean-install` then `npm run build` |
| Port 4173 already in use | Kill process: `lsof -i :4173` / `netstat -ano \| findstr :4173` |

---

## Monitoring & Analytics (Optional)

Add to `index.html` `<head>`:
```html
<!-- Sentry (Error tracking) -->
<script src="https://browser.sentry-cdn.com/7.84.0/bundle.min.js"></script>

<!-- Plausible (Privacy-friendly analytics) -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Maintenance

**Weekly:**
- Monitor error logs
- Check bundle size trends

**Monthly:**
- Review performance metrics
- Update dependencies (`npm update`)

**Quarterly:**
- Security audit (`npm audit`)
- Lighthouse re-test

---

**Next Steps:**
1. Choose hosting platform (Cloudflare Pages recommended)
2. Run health check above
3. Deploy dist/ folder
4. Test all features
5. Share deployment URL

