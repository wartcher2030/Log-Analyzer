# IdeaLogs - Advanced Analytics Dashboard

A powerful, modern analytics platform for processing and visualizing large datasets with customizable templates and cloud deployment on Cloudflare.

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:5173/
```

### Upload & Analyze

1. Click **"Import Multi-CSV"** in sidebar
2. Select CSV files (supports multiple uploads)
3. View analytics on **Dashboard** tab
4. Create formulas on **Project Plotter** tab
5. Save templates to **Standardization Lab**

## ✨ Key Features

- **✅ Multi-File Upload**: Upload multiple CSV files simultaneously with progress tracking
- **✅ Robust Parser**: Handles large files (50MB+), quoted fields, empty rows, and malformed data
- **✅ Error Handling**: Detailed error messages for failed uploads
- **✅ Smart Analytics**: Min, max, mean, std dev calculations automatically
- **✅ Formula Engine**: Create custom metrics with JavaScript expressions
- **✅ Interactive Charts**: Line, area, bar charts with zoom, pan, annotations
- **✅ Template Library**: Save and reuse plot configurations
- **✅ Cloud Ready**: Deploy to Cloudflare Workers + R1 database
- **✅ Offline Mode**: Works offline with local storage fallback
- **✅ Dark Theme**: Beautiful, professional UI

## 📊 Supported Data

- **Format**: CSV (comma-separated values)
- **Max Size**: 50MB per file
- **Max Rows**: 1,000,000 per file
- **Columns**: Unlimited
- **Types**: Auto-detection (numeric, text, datetime)

Example CSV:
```csv
Flight Time,Altitude,Desired Altitude,Temperature
0,0,0,25.5
0.1,1.2,0,25.4
0.2,2.5,0,25.3
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
# Local development (with local Workers)
VITE_API_BASE=http://localhost:8787/api

# Production (Cloudflare deployment)
# VITE_API_BASE=https://api.yourdomain.com/api
```

## 🧮 Formula Examples

Create computed columns using the formula engine:

```javascript
// Statistics
ABS([Target] - [Current])          // Absolute difference
IF([Battery] > 12, 1, 0)            // Status flag
LPF([Gyro], 0.1)                   // Smoothed data

// Multi-column
[Voltage] * [Current]               // Power calculation
([A] + [B]) / [Count]              // Average
ABS([X]) + ABS([Y]) + ABS([Z])     // Vector magnitude
```

## ☁️ Cloud Deployment

### Deploy to Cloudflare Pages (Frontend)

```bash
npm run deploy:pages
```

### Deploy Workers + Database (Backend)

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Create D1 database
wrangler d1 create idealogs

# 3. Update wrangler.toml with database ID

# 4. Deploy
npm run deploy:workers

# 5. Initialize database
npm run db:init
```

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
.
├── App.tsx                 # Main application component
├── components/             # React components
│   ├── LazyChart.tsx      # Chart visualization
│   ├── StatCard.tsx       # Stats display
├── services/               # Business logic
│   ├── dataParser.ts      # CSV parsing & validation
│   ├── database.ts        # Cloud/local storage
│   ├── formulaEngine.ts   # Formula evaluation
├── workers/                # Cloudflare Workers
│   └── src/
│       └── index.ts       # API endpoints
├── wrangler.toml          # Workers config
├── vite.config.ts         # Build config
└── types.ts               # TypeScript types
```

## 🔐 Data Privacy

- ✅ All CSV parsing happens **client-side** (in your browser)
- ✅ Data never leaves your device (unless you deploy cloud backend)
- ✅ No cookies, no tracking, no analytics
- ✅ Optional cloud storage via Cloudflare R1 database

## 📦 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Charts**: Recharts (interactive visualizations)
- **Export**: html-to-image (PNG/JPEG/PDF export)
- **Backend**: Cloudflare Workers (optional)
- **Database**: Cloudflare D1 (SQLite)

## 🎓 Common Tasks

### Task: Upload Multiple CSV Files
1. Click "Import Multi-CSV" button
2. Select multiple files from your computer
3. Watch progress bar as files upload
4. Files appear automatically in Dashboard

### Task: Create a Formula
1. Go to "Project Plotter" tab
2. Select a data file
3. Type formula: `[Altitude] * 3.28084` (convert meters to feet)
4. Click "Add Metric"
5. Formula appears in chart

### Task: Export Chart as PDF
1. Configure your chart in Project Plotter
2. Click "PDF" button
3. Chart opens in print dialog
4. Click print or save as PDF

### Task: Save a Template
1. Design your chart in Project Plotter
2. Go to "Standardization Lab"
3. Click "New Template"
4. Fill in fields (matches Project Plotter config)
5. Template automatically saved

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Files won't upload | Check file format (must be `.csv`), size < 50MB |
| "Headers not found" error | Verify first row contains column names |
| Formula not working | Use square brackets: `[ColumnName]`, check syntax |
| Charts blank | Select X-axis and at least one Y-axis metric |
| Templates not saving | For cloud: check `VITE_API_BASE` env var |

## 📚 Learn More

- [All Features Guide](./FEATURES.md) - Detailed feature documentation
- [Cloudflare Deployment](./CLOUDFLARE_DEPLOYMENT.md) - Cloud setup instructions
- [Formula Syntax](./FEATURES.md#-formula-documentation) - Complete formula reference

## 🚀 Production Deployment

### Option 1: Cloudflare Pages (Recommended)
- Free hosting with global CDN
- Auto-deploys from GitHub
- Custom domain support
- Perfect for frontend-only usage

### Option 2: Cloudflare Pages + Workers
- Add serverless backend
- Use R1 database for template storage
- Enable collaborative features
- Same-day setup

### Option 3: Docker + Your Server
- Full control over infrastructure
- Use any database
- Self-hosted option

## 📞 Support

- Check [FEATURES.md](./FEATURES.md) for detailed docs
- Review [Troubleshooting](#-troubleshooting) section
- See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for cloud setup
- Open GitHub issues for bugs

## 📄 License

MIT - Free to use and modify

---

**Built for data engineers, analysts, and researchers.** 
⭐ Star on GitHub if you find it useful!
