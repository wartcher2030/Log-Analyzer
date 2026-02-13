# 🎨 Improved Workbench UI - User Guide

## ✨ What's New

Your Project Plotter workbench has been completely redesigned for better usability, organization, and visual appeal.

---

## 🚀 Key Improvements

### 1. **Organized Multi-Section Layout**
The controls are now organized into logical groups instead of a crowded horizontal layout:

- **📊 Data Source** - Select log file and chart height
- **➡️ Axis Configuration** - X-axis selection and plot title
- **📈 Y Axis Metrics** - Large, scrollable metric selector (multi-select)
- **📏 Display Options** - Grid settings and axis labels
- **🔧 Formula Builder** - Create and manage derived metrics
- **Export Controls** - Export and screenshot options

### 2. **Enhanced Dropdown Selections**
All dropdowns now have:
- ✅ Improved styling (rounded, hover effects)
- ✅ Better readability with icons/emojis for sections
- ✅ Focus rings for accessibility
- ✅ Clear visual hierarchy
- ✅ Row count information in log file selector

### 3. **Better Space Utilization**
- **Grid Layout** - Controls arrange responsively (mobile, tablet, desktop)
- **Grouped Sections** - Related controls stay together
- **Scrollable Areas** - Y-axis selector expands without cluttering layout
- **Color-Coded Sections** - Different background colors for different sections

### 4. **Improved Canvas/Plot Area**
- **Larger, Centered Plot** - Chart takes up proper space
- **Better Margin Management** - Proper padding around edges
- **Responsive Height** - Configurable from 200px to 1200px
- **Professional Header** - Clear title and data source display
- **Empty State Message** - User-friendly prompt when no data selected

### 5. **Enhanced Statistics Display**
- **Compact Cards** - Stats displayed in compact, aligned cards
- **Color-Coded Metrics** - Each metric color-coded to its chart line
- **Left Border Accent** - Visual indicator for each metric
- **Responsive Grid** - Adapts from 1 column (mobile) to 4 columns (desktop)
- **Min/Avg/Max Format** - Easier to scan

### 6. **Better Export Options**
- **Labeled Sections** - Clear "Export:" and "Screenshot:" labels
- **Separated Controls** - Different groups for different export types
- **Debug Info Button** - Moved to right side for easy access
- **Visual Feedback** - Loading states with "..." indicator

### 7. **Formula Builder Improvements**
- **Dedicated Section** - Visually distinct formula input area
- **Better Input Fields** - Larger, clearer placeholders
- **Gradient Background** - Dashed border to highlight formula section
- **Active Formula Badges** - Color-coded badges showing applied formulas
- **Easy Removal** - X button on each formula badge

---

## 📋 How to Use the New Interface

### **Step 1: Select Data Source**
```
📊 Data Source section (top-left)
└─ Choose a log file from dropdown
   └─ Shows row count: "filename.csv (5000 rows)"
```

### **Step 2: Configure Plot Title & Height**
```
Top row controls:
├─ Set chart title (e.g., "PROPELLER ANALYSIS")
└─ Set chart height (200-1200px, default 600px)
```

### **Step 3: Select Axes**
```
Axis Configuration (second row):
├─ X Axis: Choose horizontal axis (with raw options)
└─ Title: Set your plot title
```

### **Step 4: Select Metrics (Y Axis)**
```
📈 Y Axis Metrics section
└─ Check multiple metrics you want to display
   └─ Scrollable list of all available columns
   └─ Multi-select with checkboxes
```

### **Step 5: Configure Display**
```
📏 Display Options section
├─ Toggle Major/Minor grids
├─ Set X-axis label (e.g., "Time (s)")
└─ Set Y-axis label (e.g., "Altitude (m)")
```

### **Step 6: Create Formulas (Optional)**
```
🔧 Formula Builder section
├─ Enter formula name: "ALT_ERROR"
├─ Enter expression: "ABS([Altitude] - [Desired_Altitude])"
└─ Click "Add Metric"
```

Examples:
```
Simple Math:         [Power] * 2, [Voltage] / [Current]
Logic:               IF([Battery] < 14.5, 0, 1)
Functions:           ABS([A] - [B]), LPF([C], 0.1)
Complex:             IF([Status] > 0, [Power] * 1.1, 0)
```

### **Step 7: View Plot**
```
Once configured:
1. X-axis selected ✓
2. At least one Y metric selected ✓
3. Data source selected ✓
└─ Plot auto-generates in the canvas area below
```

### **Step 8: Analyze & Export**
```
View statistics below chart:
└─ Min/Average/Max for each metric

Export options:
├─ PDF Export: Full resolution export
├─ PNG Export: Lossless format
├─ JPEG Export: Compressed format
├─ Screenshot PNG/JPEG/SVG: Quick screen capture
└─ Debug Info: Export data for troubleshooting
```

---

## 🎯 Control Descriptions

### **Data Source** 📊
- **Dropdown**: Select from uploaded log files
- **Shows**: Filename and row count
- **Example**: "Flight_Log_001.csv (12530 rows)"

### **Chart Height** 📏
- **Range**: 200px - 1200px
- **Default**: 600px
- **Effect**: Controls vertical size of plot area

### **X Axis (Horizontal)** ➡️
- **Options**: All columns + raw variants
- **Example**: "Flight_Time" or "Flight_Time_raw"
- **Purpose**: Defines horizontal axis (usually time/distance)

### **Plot Title** 📈
- **Format**: Auto-converts to UPPERCASE
- **Purpose**: Main heading for exported plots
- **Example**: "MOTOR_TELEMETRY_ANALYSIS"

### **Y Axis Metrics** 📊
- **Multi-Select**: Check multiple columns
- **Scroll**: If many columns exist
- **Color-Coded**: Each line gets unique color

### **Grids** 📐
- **Major Grid**: Main grid lines (enabled by default)
- **Minor Grid**: Finer grid lines (optional)
- **Visibility**: Helps read values on chart

### **Axis Labels** 📝
- **X Label**: Appears at bottom (e.g., "Time (seconds)")
- **Y Label**: Appears on left side (rotated, e.g., "Altitude (meters)")

### **Formulas** 🔧
Create derived metrics using:
- **Math**: +, -, *, /, ** (power), % (modulo)
- **Functions**: ABS(), IF(), LPF()
- **Column Reference**: [ColumnName]
- **Result**: New column appears in Y-axis selector

### **Export** 💾
- **PDF**: Professional, best for printing
- **PNG**: Web-friendly, lossless
- **JPEG**: Smaller file size, some compression
- **SVG**: Vector format, scalable

---

## 🎨 Visual Design Features

### **Color Coding**
- **Indigo** - Main action buttons, important controls
- **Slate** - Neutral text and backgrounds
- **Gradient** - Formula builder section stands out
- **Chart Colors** - Each metric gets unique color from palette

### **Responsive Behavior**
| Screen Size | Layout |
|------------|--------|
| Mobile (<640px) | 1 column stack |
| Tablet (640-1024px) | 2 columns |
| Desktop (>1024px) | 3-4 columns |
| Statistics | 1→2→4 cols |

### **Hover Effects**
- Dropdowns become active (border color change)
- Statistic cards lift with shadow
- Buttons scale/color change
- Checkboxes highlight

### **Focus States**
- All inputs have focus rings (blue outline)
- Keyboard navigation fully supported
- Screen reader accessible

---

## 🐛 Troubleshooting

### **Plot Not Showing**
```
Required to see plot:
✓ Log file selected (📊 Data Source)
✓ X-axis selected (➡️ Axis Configuration)
✓ At least 1 Y metric checked (📈 Y Axis Metrics)

Status: "Canvas Empty" message appears if any missing
```

### **Limited Columns Visible**
```
The Y Axis Metrics section has scrolling:
→ Scroll within the bordered area to see all columns
→ Click checkboxes to select/deselect metrics
```

### **Formula Not Applied**
```
1. Check formula name is entered
2. Check formula expression is valid (see examples)
3. Click "Add" button
4. Look for formula badge showing it was added
5. Formula should appear in Y-axis selector after
```

### **Export Issues**
```
Before exporting:
1. Ensure plot is visible (not "Canvas Empty")
2. Try a smaller export height (600-800px)
3. Use PNG first (if PDF doesn't work)
4. Check browser console for errors (F12)
```

---

## 🔑 Keyboard Shortcuts

- **Tab** - Navigate between controls
- **Enter** - Click active button
- **Space** - Toggle checkboxes
- **Escape** - Close dialogs
- **↑/↓** - Navigate dropdowns

---

## 💡 Tips & Tricks

### **Pro Tips**

1. **Save Configurations**
   - Use browser DevTools to export current config
   - Screenshot your working setup
   - Formula combinations make great templates

2. **Performance**
   - For large datasets (>50k rows), set Chart Height to 600px
   - Limited to 10,000 points per chart (auto-downsamples)
   - Formulas are cached for speed

3. **Better Comparisons**
   - Use 3-4 related metrics on Y axis
   - Keep formulas simple for speed
   - Use different heights for different analysis

4. **Export Quality**
   - PDF best for reports
   - PNG best for web/docs
   - SVG best for further editing
   - JPEG smallest file size

5. **Analysis Workflow**
   ```
   1. Select data source
   2. Choose relevant metrics
   3. Adjust grid/labels
   4. Create derived formulas
   5. Export to PNG
   6. Review and annotate offline
   ```

---

## 🚀 Next Steps

1. **Upload your first CSV** - Go to Dashboard, upload file
2. **Select data** - Choose file in 📊 Data Source
3. **Configure plot** - Set axes and metrics
4. **View chart** - Plot auto-generates
5. **Create formulas** - Add derived metrics as needed
6. **Export** - Save your analysis

---

## 🎯 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| Layout | Cramped horizontal | Organized grid |
| Controls | Messy, overlapping | Clean, grouped |
| Metrics Selection | Tiny scrollable box | Large, clear area |
| Statistics | Small cards | Compact, color-coded |
| Export | Cramped buttons | Clear sections |
| Responsiveness | Limited | Full desktop/mobile |
| Visual Hierarchy | Unclear | Clear organization |
| Empty State | Generic text | Helpful icon + message |
| Accessibility | Limited | Full keyboard nav |

---

## 📞 Support

**For issues with the new UI:**
1. Check that you've selected all 3 required items (log file, X-axis, Y metrics)
2. Try refreshing the page (F5)
3. Clear browser cache if styles don't update
4. Use Firefox/Chrome for best compatibility
5. Export debug info for troubleshooting

---

**UI Version**: 2.0 (Redesigned)  
**Build**: Optimized and responsive  
**Compatibility**: All modern browsers  
**Status**: Ready for production use

