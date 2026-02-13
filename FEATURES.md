# IdeaLogs - Advanced Analytics Dashboard

A powerful, modern analytics platform for processing and visualizing large datasets with customizable templates and cloud deployment capabilities.

## 🎯 Features

### 📊 Advanced Analytics
- **Robust CSV Parser**: Handles large files (up to 50MB), various CSV formats, and malformed data
- **Real-time Progress Tracking**: Visual feedback for multi-file uploads
- **Smart Data Validation**: Automatic detection of columns, data types, and anomalies
- **Statistical Analysis**: Min, max, mean, and standard deviation calculations per column
- **Batch Processing**: Upload and process multiple files simultaneously without crashing

### 🛠️ Data Processing
- **Formula Engine**: Create custom computed columns using JavaScript expressions
  - Math functions: ABS, IF, LPF (Low-Pass Filter)
  - Column referencing: `[ColumnName]`
  - Complex expressions: `ABS([Target] - [Current]) * 1.2`
- **Low-Pass Filtering**: Smooth noisy signal data with configurable alpha values
- **Conditional Logic**: IF statements for status mapping and data classification

### 📈 Visualization
- **Interactive Charts**: Line, area, and bar charts powered by Recharts
- **Real-time Filtering**: Filter and zoom charts dynamically
- **Custom Annotations**: Click on data points to add notes and insights
- **Multi-axis Plotting**: Compare multiple metrics on the same chart
- **Chart Export**: Save as PNG, JPEG, PDF, or SVG

### 💾 Template Management
- **Standardization Lab**: Create and save reusable plot templates
- **Cloud Persistence**: Templates saved to Cloudflare R1 database
- **Local Storage**: Automatic fallback to browser storage if offline
- **Template Library**: Pre-configured templates for common analysis scenarios

### ☁️ Cloud Deployment
- **Cloudflare Workers**: Serverless backend for API endpoints
- **Cloudflare R1 (D1)**: SQLite database for template persistence
- **Cloudflare Pages**: Static frontend hosting with global CDN
- **Free Tier Support**: Full functionality on Cloudflare free plan

## 📋 System Requirements

- **Node.js**: v18 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **Internet Connection**: For cloud features (optional for offline mode)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173/
```

### Upload Files

1. Click **"Import Multi-CSV"** button in sidebar
2. Select one or multiple CSV files
3. Monitor upload progress in real-time
4. View analytics on Dashboard tab

### Create Formula

1. Go to **Project Plotter** tab
2. Select a data file
3. Enter formula name and expression (e.g., `[Altitude] * 0.3048`)
4. Click **"Add Metric"**
5. Use computed column in charts

### Save Templates

1. Configure your chart in **Project Plotter**
2. Go to **Standardization Lab**
3. Click **"New Template"** and configure
4. Template automatically saves to cloud (if connected)

## 📊 Example CSV Format

```csv
Flight Time,Altitude,Desired Altitude,Phi,The,Psi
0,0,0,0.1,-0.2,0
0.1,1.2,0,0.15,-0.18,-0.05
0.2,2.5,0,0.2,-0.15,-0.1
...
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
# For local Cloudflare Workers development
VITE_API_BASE=http://localhost:8787/api

# For production deployment
# VITE_API_BASE=https://api.yourdomain.com/api
```

### File Upload Limits

- **Maximum file size**: 50MB
- **Maximum rows per file**: 1,000,000
- **Supported format**: CSV

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite (fast bundling)
- **Charting**: Recharts for interactive visualizations
- **Styling**: Tailwind CSS for responsive design
- **Export**: html-to-image for chart downloads

### Backend (Optional)
- **Workers**: Cloudflare Workers for serverless API
- **Database**: D1 (SQLite) for template persistence
- **CORS**: Enabled for cross-origin requests
- **Authentication**: Cloudflare credentials

## 📱 Features Breakdown

### Dashboard Tab
- View all uploaded datasets
- Quick statistical summary per metric
- Interactive chart with annotations
- Individual chart export (PNG/JPEG/PDF)

### Project Plotter Tab
- Create custom plots with workbench controls
- Real-time chart updates
- Formula builder with documentation
- Advanced grid and axis configuration
- Comprehensive statistical summary

### Standardization Lab
- Design reusable plot templates
- Configure axis labels and ranges
- Save to cloud or local storage
- Template library management

## 📚 Formula Documentation

### Available Functions

**Math Functions**
- `ABS(x)` - Absolute value
- `IF(condition, true_val, false_val)` - Conditional logic
- `LPF([column], alpha)` - Low-pass filter

**Operators**
- `+ - * / ** %` - Standard math operators
- `> < >= <= == !=` - Comparison operators
- `&& || !` - Logical operators

### Examples

```javascript
// Delta calculation
ABS([Target] - [Current])

// Status mapping
IF([Voltage] > 11.1, 1, 0)

// Signal smoothing
LPF([Gyro_X], 0.05)

// Derived metrics
[Current] * [Voltage]

// Complex expression
ABS([Altitude] - [DesiredAltitude]) * IF([Armed], 1, 0)
```

## ☁️ Cloud Deployment

### Quick Deploy to Cloudflare Pages

```bash
# Build the app
npm run build

# Deploy to Cloudflare Pages
npm run deploy:pages
```

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for detailed setup.

### Deploy Workers (Optional)

```bash
# Setup Wrangler
wrangler login

# Create D1 database
wrangler d1 create idealogs

# Update wrangler.toml with database ID

# Deploy
npm run deploy:workers

# Initialize database
npm run db:init
```

## 🔒 Data Privacy

- **Local Processing**: All CSV parsing happens in your browser
- **Optional Cloud**: Templates only sync if you configure Cloudflare backend
- **No Tracking**: No analytics or user tracking
- **Browser Storage**: Data persists locally in IndexedDB/LocalStorage

## 🐛 Troubleshooting

### Files not uploading?
- Check file format (must be CSV)
- Verify file size < 50MB
- Check browser console for errors

### Formula not working?
- Click "Formula Documentation" for syntax help
- Use correct column names in square brackets
- Check browser console for errors

### Templates not saving?
- For local mode: Data saved to browser storage only
- For cloud mode: Verify API base URL in environment
- Check network tab for API errors

### Performance issues?
- Large files (>100k rows) may be slow
- Use filters and date ranges when possible
- Close other browser tabs to free memory

## 🛣️ Roadmap

- [ ] Database schema visualization
- [ ] CSV export from charts
- [ ] User authentication
- [ ] Collaborative workspaces
- [ ] Real-time data streaming
- [ ] Advanced ML analytics
- [ ] Mobile app

## 📄 License

MIT License - Feel free to use in your projects

## 🤝 Contributing

Contributions welcome! Please submit pull requests or open issues.

## 📞 Support

- Check [Troubleshooting](#-troubleshooting) section
- Review [Formula Documentation](#-formula-documentation)
- See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for cloud setup
- Open an issue on GitHub for bugs

---

**Built with ❤️ for data engineers and analysts**
