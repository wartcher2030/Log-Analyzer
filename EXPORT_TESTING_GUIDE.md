# 🧪 Export System Testing & Verification Guide

## Pre-Testing Checklist

- [x] New `exportService.ts` created
- [x] `App.tsx` updated with new export function
- [x] `package.json` updated with jsPDF dependency
- [x] Dependencies installed (`npm install`)
- [x] No TypeScript compilation errors
- [x] All documentation created

---

## Phase 1: Development Setup Verification

### Step 1: Verify Installation
```bash
npm list jspdf
# Expected output: jspdf@2.5.1 (or similar)
```

### Step 2: Check TypeScript Compilation
```bash
npx tsc --noEmit
# Expected: No errors
```

### Step 3: Start Development Server
```bash
npm run dev
# Expected: Server starts at http://localhost:5173
```

### Step 4: Browser Console Check
```javascript
// Open DevTools (F12) → Console
// Should see no errors related to exports
// Verify modules loaded correctly
```

---

## Phase 2: Functional Testing

### Test A: Dashboard Export (PNG Format)

**Procedure:**
1. Navigate to Dashboard tab
2. Upload a test CSV file (see Test Data below)
3. Select the uploaded log
4. Click **PNG** export button
5. Wait for processing (may take 2-5 seconds)
6. Verify file downloads

**Verification:**
- [ ] File downloads without error
- [ ] File name format: `IdeaLogs_*.png`
- [ ] File size: 8-15 MB (4K resolution)
- [ ] File opens in image viewer
- [ ] Image displays properly (not corrupted)
- [ ] Professional layout visible (headers, chart, footer)

### Test B: Dashboard Export (JPEG Format)

**Procedure:**
1. Same as Test A
2. Click **JPEG** export button

**Verification:**
- [ ] File downloads without error
- [ ] File name format: `IdeaLogs_*.jpeg`
- [ ] File size: 2-4 MB (smaller than PNG)
- [ ] File opens in image viewer
- [ ] Quality acceptable (95% compression)

### Test C: Dashboard Export (PDF Format)

**Procedure:**
1. Same as Test A
2. Click **PDF** export button

**Verification:**
- [ ] File downloads without error
- [ ] File name format: `IdeaLogs_*.pdf`
- [ ] File size: 3-6 MB
- [ ] File opens in PDF reader
- [ ] All elements visible (chart, stats, headers)
- [ ] Print preview works (Ctrl+P)

### Test D: Project Plotter Export (All Formats)

**Procedure:**
1. Navigate to Project Plotter tab
2. Configure a plot:
   - Select Log Data
   - Choose X-axis column
   - Choose Y-axis columns (1-3)
   - Set axis labels
3. Export in PNG/JPEG/PDF formats

**Verification:**
- [ ] All three formats work
- [ ] Professional layout matches dashboard
- [ ] Statistics section displays correctly
- [ ] File names include plot title
- [ ] Same 4K resolution quality

### Test E: Multiple File Export

**Procedure:**
1. Upload 3-5 different CSV files
2. Export each in different formats
3. Observe file name consistency
4. Check file properties

**Verification:**
- [ ] Each file has unique name (includes timestamp)
- [ ] No file overwrites
- [ ] All files download successfully
- [ ] Consistent quality across all files

---

## Phase 3: Quality Verification

### Test F: 4K Resolution Verification

**Procedure:**
1. Export a PNG file
2. Right-click → Properties (Windows) or Get Info (Mac)
3. Check image dimensions

**Expected:**
- Dimensions: 3840 × 2160 pixels
- DPI: 300 (when printed)

**Verification:**
- [ ] Correct pixel dimensions
- [ ] Professional print quality

### Test G: Visual Quality Check

**Procedure:**
1. Open exported image in image viewer
2. Zoom to 100% (actual size)
3. Inspect each section

**Checklist:**
- [ ] Header section
  - [ ] App name visible and formatted
  - [ ] Title appears bold and large
  - [ ] File name metadata present
- [ ] Chart section
  - [ ] Grid lines visible
  - [ ] Axis labels readable
  - [ ] Data series colors match dashboard
  - [ ] Legend present
  - [ ] No overlapping elements
- [ ] Statistics section
  - [ ] All columns visible
  - [ ] Numbers formatted correctly
  - [ ] Color coding correct (min/max/mean/σ)
- [ ] Footer section
  - [ ] Timestamp present
  - [ ] Professional watermark visible

### Test H: Professional Layout Verification

**Procedure:**
1. Compare exported image with Project Plotter on screen
2. Check consistency

**Verification:**
- [ ] Same color scheme
- [ ] Same typography
- [ ] Same chart styling
- [ ] Same statistical display
- [ ] Professional appearance

---

## Phase 4: Performance Testing

### Test I: Large File Performance

**Procedure:**
1. Create CSV with 100,000 rows
2. Upload and export
3. Measure time

**Expected Performance:**
- Export time: 2-5 seconds for 100K rows
- Memory usage: Peak ~50MB
- File size: 8-15MB

**Verification:**
- [ ] Export completes without crash
- [ ] Memory doesn't exceed 100MB
- [ ] File generates correctly
- [ ] Quality maintained

### Test J: Multiple Concurrent Exports

**Procedure:**
1. Click export
2. While processing, click export again (different format)
3. Repeat for 3rd format

**Expected Behavior:**
- First export completes
- Subsequent exports queue properly
- No crashes or data corruption

**Verification:**
- [ ] All exports complete successfully
- [ ] No duplicate or lost files
- [ ] Each file is unique and correct

---

## Phase 5: Format-Specific Testing

### Test K: PNG Export Details

**Verification Checklist:**
- [ ] Lossless compression
- [ ] No quality loss at 100% zoom
- [ ] File opens in all image viewers
- [ ] Transparency handled correctly
- [ ] Suitable for archival/printing

### Test L: JPEG Export Details

**Verification Checklist:**
- [ ] 95% quality setting applied
- [ ] File size reasonable (2-4MB)
- [ ] No visible compression artifacts
- [ ] Opens in all viewers
- [ ] Suitable for email/web

### Test M: PDF Export Details

**Verification Checklist:**
- [ ] Opens in Adobe Reader
- [ ] Opens in browser PDF viewer
- [ ] Print preview works
- [ ] Metadata correct (title, author)
- [ ] Page layout correct (landscape)
- [ ] All text searchable (if vector)
- [ ] Page dimensions appropriate for printing

---

## Phase 6: Error Handling Testing

### Test N: Missing Configuration

**Procedure:**
1. Navigate to Project Plotter
2. Click export without configuring plot

**Expected:**
- Error message: "Please configure plot before exporting"
- No file downloaded
- No crash

**Verification:**
- [ ] Proper error message shown
- [ ] User guided to configure first
- [ ] App remains stable

### Test O: Large Dataset Handling

**Procedure:**
1. Upload 1MB+ CSV file
2. Export in all formats
3. Observe behavior

**Expected:**
- May take 5-10 seconds
- App remains responsive
- All files generate correctly

**Verification:**
- [ ] No timeout errors
- [ ] Files complete successfully
- [ ] Quality maintained

### Test P: Memory Stress

**Procedure:**
1. Upload largest possible CSV (test limits)
2. Apply multiple formulas
3. Export with statistics

**Expected:**
- App handles gracefully
- Reasonable memory usage
- Clear feedback to user

**Verification:**
- [ ] No out-of-memory errors
- [ ] App remains stable
- [ ] Export completes

---

## Test Data (Sample CSV Files)

### Small Test File (test_small.csv)
```csv
Time,Temperature,Pressure,Humidity
0,20.5,101.3,45
1,20.6,101.2,46
2,20.7,101.1,47
3,20.8,101.0,48
4,21.0,100.9,49
```

### Medium Test File (test_medium.csv)
```csv
Timestamp,Altitude,Velocity,Acceleration,Temperature
0,0,0,0,20.5
1,10,5,10,20.6
2,40,15,12,20.7
3,90,30,14,20.8
4,160,50,15,21.0
5,250,70,14,21.2
... (continue pattern to ~1000 rows)
```

### Large Test File (test_large.csv)
```csv
Sample,Value1,Value2,Value3,Value4,Value5
0,100,200,150,180,220
1,102,198,152,182,218
... (continue pattern to ~100000 rows)
```

---

## Expected Results Summary

### All Tests Passing Should Show:

| Category | Result |
|----------|--------|
| Export Formats | ✅ PNG, JPEG, PDF all work |
| Resolution | ✅ 3840 × 2160 (4K) confirmed |
| File Sizes | ✅ PNG 8-15MB, JPEG 2-4MB, PDF 3-6MB |
| Quality | ✅ Professional 300 DPI output |
| Performance | ✅ 2-5s for typical export |
| Design | ✅ Matches Project Plotter |
| Statistics | ✅ Min/Max/Mean/σ all calculated |
| Error Handling | ✅ Proper messages on errors |
| Stability | ✅ No crashes on edge cases |

---

## Post-Testing Checklist

### If All Tests Pass ✅
- [ ] Export system is production-ready
- [ ] Document user in README
- [ ] Create user guide for export feature
- [ ] Test on deployment environment
- [ ] Monitor user feedback

### If Issues Found ❌
- [ ] Document specific issue
- [ ] Note which test failed
- [ ] Provide steps to reproduce
- [ ] Check console errors (F12 → Console)
- [ ] Report with screenshot/file

---

## Debugging Tips

### Check Browser Console (F12)
```javascript
// Should see no errors
// Look for:
- Canvas-related errors
- PDF generation errors
- File download errors
- Memory warnings
```

### Monitor Network (F12 → Network)
```
// Check if files download properly
// Look for:
- Correct file size
- Successful status (200)
- Proper MIME type
```

### Performance Monitoring (F12 → Performance)
```javascript
// Record export process
// Check for:
- Long tasks (>50ms)
- Memory spikes
- CPU usage
```

---

## Support Information

### For Questions or Issues:
1. Check console errors (F12)
2. Review this guide
3. Check `EXPORT_IMPROVEMENTS.md` documentation
4. Verify dependencies installed (`npm list jspdf`)
5. Try restarting dev server (`npm run dev`)

### Common Solutions:
- **Export fails**: Check if plot is configured
- **Large files**: Use JPEG format instead of PNG
- **Slow export**: This is normal for 4K - be patient
- **PDF won't open**: Ensure jsPDF installed correctly

---

## Test Log Template

Use this to track your testing:

```
Date: ___________
Tester: ___________

Test A (PNG Export): ☐ PASS ☐ FAIL
Notes: _________________________________

Test B (JPEG Export): ☐ PASS ☐ FAIL
Notes: _________________________________

Test C (PDF Export): ☐ PASS ☐ FAIL
Notes: _________________________________

Test D (Plotter Export): ☐ PASS ☐ FAIL
Notes: _________________________________

Test E (Multiple Files): ☐ PASS ☐ FAIL
Notes: _________________________________

Test F (4K Resolution): ☐ PASS ☐ FAIL
Notes: _________________________________

Test G (Visual Quality): ☐ PASS ☐ FAIL
Notes: _________________________________

Test H (Layout Match): ☐ PASS ☐ FAIL
Notes: _________________________________

Overall Result: ☐ ALL PASS ☐ NEEDS FIXES
```

---

**Version:** 1.0.0  
**Created:** February 11, 2026  
**Status:** Ready for Testing
