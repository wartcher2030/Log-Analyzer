import { jsPDF } from 'jspdf';
import { LogData, Stats, PlotTemplate } from '../types';

// Responsive scaling: base design width and scale factor
const BASE_WIDTH = 1200;

export interface ExportOptions {
  width?: number;
  height?: number;
  dpi?: number;
  backgroundColor?: string;
  format?: 'png' | 'jpeg' | 'pdf';
}

/**
 * Professional Canvas-based Export System
 * Generates 4K resolution exports with professional formatting
 */

/**
 * Render chart to canvas with professional styling
 */
export const renderChartToCanvas = async (
  data: Record<string, any>[],
  template: Partial<PlotTemplate>,
  colors: string[],
  appName: string,
  fileName: string,
  width: number = 3840, // 4K width (3840x2160)
  height: number = 2160,
  includeStats: boolean = true
): Promise<HTMLCanvasElement> => {
  try {
    // Create off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    const SCALE = width / BASE_WIDTH;
    const padding = Math.round(40 * SCALE);
    const headerHeight = Math.round(140 * SCALE);
    const footerHeight = Math.round(60 * SCALE);
    const chartHeight = includeStats ? Math.round(520 * SCALE) : height - headerHeight - footerHeight - padding * 2;
    const statsHeight = includeStats ? Math.round(180 * SCALE) : 0;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Header section
    renderHeader(ctx, appName, template.title || 'Report', fileName, padding, width, headerHeight, SCALE);
    
    // Chart area
    const chartStartY = padding + headerHeight;
    const chartContentPadding = Math.round(16 * SCALE);
    renderChartFrame(ctx, width, chartStartY, chartHeight, padding, SCALE);
    
    // Draw chart content with more internal padding for visibility
    await renderChartContent(ctx, data, template, colors, 
      padding + chartContentPadding, 
      chartStartY + chartContentPadding, 
      width - padding * 2 - chartContentPadding * 2, 
      chartHeight - chartContentPadding * 2,
      SCALE);
    
    // Statistics section
    if (includeStats && template.yAxes && template.yAxes.length > 0) {
      const statsStartY = chartStartY + chartHeight + Math.round(40 * SCALE);
      renderStatsSection(ctx, data, template.yAxes, colors, padding, statsStartY, width - padding * 2, statsHeight, SCALE);
    }
    
    // Footer
    renderFooter(ctx, width, height, padding, SCALE);
    
    return canvas;
  } catch (error) {
    throw new Error(`Canvas rendering failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Debug helper: prepare internal mapping used by canvas renderer
 * Returns xValuesPerRow, xLabels (if categorical), and yArrays for each y axis
 */
export const prepareExportDebug = (
  data: Record<string, any>[],
  template: Partial<PlotTemplate>
) => {
  const xKey = template.xAxis;
  const rawX = data.map((row) => row[xKey]);
  const parsedXPerRow = rawX.map((v, idx) => {
    if (v === undefined || v === null) return NaN;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : NaN;
  });

  const allXNaN = parsedXPerRow.every((v) => Number.isNaN(v));
  let xValuesPerRow: number[];
  let xLabels: (string | null)[] | null = null;
  if (allXNaN) {
    xValuesPerRow = data.map((_, i) => i);
    xLabels = rawX.map((v) => (v == null ? null : String(v)));
  } else {
    xValuesPerRow = parsedXPerRow.map((v, i) => (Number.isNaN(v) ? i : v));
  }

  const yAxes = template.yAxes || [];
  const yArrays = yAxes.map((yKey) =>
    data.map((row) => {
      const val = row[yKey];
      return typeof val === 'number' ? val : parseFloat(String(val));
    })
  );

  return {
    xKey,
    xLabels,
    xValuesPerRow,
    yAxes,
    yArrays,
    sampleRows: data.slice(0, 30),
  };
};

/**
 * Render professional header
 */
const renderHeader = (
  ctx: CanvasRenderingContext2D,
  appName: string,
  title: string,
  fileName: string,
  x: number,
  width: number,
  height: number,
  SCALE: number
) => {
  const lineHeight = Math.max(12, Math.round(18 * SCALE));
  const topPadding = Math.round(10 * SCALE);

  // App name and badge
  ctx.fillStyle = '#6366f1';
  ctx.font = `bold ${Math.round(12 * SCALE)}px "Segoe UI", sans-serif`;
  ctx.fillText(appName.toUpperCase(), x, x + topPadding);

  // Title
  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${Math.round(36 * SCALE)}px "Segoe UI", sans-serif`;

  // Handle long titles with wrapping
  const maxWidth = width - x * 2;
  const wrappedTitle = wrapText(title, ctx.font, maxWidth);
  let titleY = x + topPadding + lineHeight;

  wrappedTitle.forEach(line => {
    ctx.fillText(line, x, titleY);
    titleY += lineHeight;
  });

  // File info
  ctx.fillStyle = '#64748b';
  ctx.font = `${Math.round(12 * SCALE)}px "Segoe UI", sans-serif`;
  ctx.fillText(`Source: ${fileName}`, x, x + height - Math.round(20 * SCALE));
};

/**
 * Render chart frame/border
 */
const renderChartFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number,
  padding: number,
  SCALE: number
) => {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = Math.max(1, Math.round(2 * SCALE));
  ctx.fillStyle = '#f8fafc';

  const x = padding;
  const w = width - padding * 2;

  ctx.fillRect(x, y, w, height);
  ctx.strokeRect(x, y, w, height);

  // Grid lines
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = Math.max(1, Math.round(1 * SCALE));

  const gridSpacing = Math.round(80 * SCALE);
  for (let i = gridSpacing; i < w; i += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }

  for (let i = gridSpacing; i < height; i += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + w, y + i);
    ctx.stroke();
  }
};

/**
 * Render actual chart content with axes and data
 */
const renderChartContent = async (
  ctx: CanvasRenderingContext2D,
  data: Record<string, any>[],
  template: Partial<PlotTemplate>,
  colors: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  SCALE: number
) => {
  if (!template.xAxis || !template.yAxes || template.yAxes.length === 0 || data.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.round(16 * SCALE)}px "Segoe UI", sans-serif`;
    ctx.fillText('No data to display', x + width / 2 - 80, y + height / 2);
    return;
  }
  
  // Extract numeric values from all data points, preserving index alignment.
  const xKey = template.xAxis;
  const rawX = data.map((row) => row[xKey]);
  const parsedXPerRow = rawX.map((v, idx) => {
    if (v === undefined || v === null) return NaN;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : NaN;
  });

  // If all x values are non-numeric, treat as ordinal categories (use indices for plotting)
  const allXNaN = parsedXPerRow.every((v) => Number.isNaN(v));
  let xValuesPerRow: number[];
  let xLabels: (string | null)[] | null = null;
  if (allXNaN) {
    xValuesPerRow = data.map((_, i) => i);
    xLabels = rawX.map((v) => (v == null ? null : String(v)));
  } else {
    // For numeric axis, replace NaN entries with their index to keep alignment
    xValuesPerRow = parsedXPerRow.map((v, i) => (Number.isNaN(v) ? i : v));
  }

  if (xValuesPerRow.length === 0) return;

  // Calculate scales with better precision and padding
  const xMin = Math.min(...xValuesPerRow);
  const xMax = Math.max(...xValuesPerRow);
  const xRange = xMax - xMin || 1;
  const xPadding = xRange * 0.02;
  
  const yArrays = template.yAxes.map(yKey => 
    data.map((row) => {
      let val = row[yKey];
      if (val === undefined || val === null) val = 0;
      return typeof val === 'number' ? val : parseFloat(String(val));
    })
  );
  
  if (yArrays.some(arr => arr.length === 0)) return;
  
  const allYValues = yArrays.flat().filter(v => !isNaN(v));
  if (allYValues.length === 0) return;
  
  const yMin = Math.min(...allYValues);
  const yMax = Math.max(...allYValues);
  const yRange = yMax - yMin || 1;
  const yPadding = yRange * 0.05;
  
  // Helper to convert data to pixel coordinates
  const dataToPixel = (dataX: number, dataY: number) => {
    const normalizedX = (dataX - (xMin - xPadding)) / (xRange + xPadding * 2);
    const normalizedY = (dataY - (yMin - yPadding)) / (yRange + yPadding * 2);
    const pixelX = x + normalizedX * width;
    const pixelY = y + height - normalizedY * height;
    return { x: Math.max(x, Math.min(x + width, pixelX)), y: Math.max(y, Math.min(y + height, pixelY)) };
  };
  
  // Draw axis tick marks and labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(11 * SCALE)}px "Segoe UI", sans-serif`;
  
  // X-axis labels (support numeric or categorical)
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const val = xMin + (xRange / xTicks) * i;
    const pos = dataToPixel(val, yMin - yPadding);
    ctx.textAlign = 'center';
    if (xLabels) {
      // Map tick position to nearest category index
      const idx = Math.round(((val - xMin) / (xRange || 1)) * (xLabels.length - 1));
      const lbl = xLabels[Math.max(0, Math.min(xLabels.length - 1, idx))];
      ctx.fillText(String(lbl ?? ''), pos.x, pos.y + Math.round(40 * SCALE));
    } else {
      ctx.fillText(val.toFixed(1), pos.x, pos.y + Math.round(40 * SCALE));
    }
  }
  
  // Y-axis labels
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = yMin + (yRange / yTicks) * i;
    const pos = dataToPixel(xMin - xPadding, val);
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(2), pos.x - Math.round(20 * SCALE), pos.y + Math.round(5 * SCALE));
  }
  
  // Draw lines for each Y axis - render ALL data points
  // Determine draw order: numeric X -> sort by X value; categorical -> use original order
  const indices = data.map((_, i) => i);
  let drawOrder = indices;
  if (!allXNaN) {
    drawOrder = indices.slice().sort((a, b) => (xValuesPerRow[a] - xValuesPerRow[b]));
  }

  template.yAxes.forEach((yKey, idx) => {
    const yValues = yArrays[idx];
    ctx.strokeStyle = colors[idx % colors.length];
    ctx.lineWidth = Math.max(1, Math.round((template.strokeWidth || 2) * SCALE));
    ctx.beginPath();
    
    let firstPoint = true;
    for (let k = 0; k < drawOrder.length; k++) {
      const i = drawOrder[k];
      const xVal = xValuesPerRow[i];
      const yVal = yValues[i];
      if (!isNaN(xVal) && !isNaN(yVal)) {
        const pos = dataToPixel(xVal, yVal);
        if (firstPoint) {
          ctx.moveTo(pos.x, pos.y);
          firstPoint = false;
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
    }
    
    ctx.stroke();
  });
  
  // Axes labels
  ctx.fillStyle = '#64748b';
  ctx.font = `bold ${Math.round(14 * SCALE)}px "Segoe UI", sans-serif`;

  // X axis label
  if (template.xAxisLabel) {
    ctx.fillText(template.xAxisLabel, x + width / 2 - 50, y + height + Math.round(40 * SCALE));
  }

  // Y axis label
  if (template.yAxisLabel) {
    ctx.save();
    ctx.translate(x - Math.round(60 * SCALE), y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(template.yAxisLabel, 0, 0);
    ctx.restore();
  }
};

/**
 * Render statistics section
 */
const renderStatsSection = (
  ctx: CanvasRenderingContext2D,
  data: Record<string, any>[],
  yAxes: string[],
  colors: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  SCALE: number
) => {
  // Section title
  ctx.fillStyle = '#6366f1';
  ctx.font = `bold ${Math.round(14 * SCALE)}px "Segoe UI", sans-serif`;
  ctx.fillText('STATISTICAL SUMMARY', x, y);

  const statsBoxHeight = Math.round(80 * SCALE);
  const statsBoxWidth = (width - Math.round(30 * SCALE)) / Math.min(3, yAxes.length);
  const boxGap = Math.round(12 * SCALE);
  const boxY = y + Math.round(40 * SCALE);
  
  yAxes.forEach((yKey, idx) => {
    const values = data.map(row => {
      const val = row[yKey];
      return typeof val === 'number' ? val : parseFloat(String(val));
    }).filter(v => !isNaN(v));
    
    if (values.length === 0) return;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const boxX = x + (idx % 3) * (statsBoxWidth + boxGap);
    const boxY2 = boxY + Math.floor(idx / 3) * (statsBoxHeight + boxGap);
    
    // Box background
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * SCALE));
    ctx.fillRect(boxX, boxY2, statsBoxWidth, statsBoxHeight);
    ctx.strokeRect(boxX, boxY2, statsBoxWidth, statsBoxHeight);

    const padding = Math.round(10 * SCALE);
    const textX = boxX + padding;
    let textY = boxY2 + padding + Math.round(18 * SCALE);
    
    // Column name
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${Math.round(12 * SCALE)}px "Segoe UI", sans-serif`;
    ctx.fillText(yKey, textX, textY);
    textY += Math.round(30 * SCALE);

    // Stats values
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.round(11 * SCALE)}px "Segoe UI", sans-serif`;
    const lineGap = Math.round(18 * SCALE);
    
    ctx.fillText(`Min: ${min.toFixed(4)}`, textX, textY);
    textY += lineGap;
    ctx.fillText(`Max: ${max.toFixed(4)}`, textX, textY);
    textY += lineGap;
    ctx.fillText(`Mean: ${mean.toFixed(4)}`, textX, textY);
    textY += lineGap;
    ctx.fillText(`σ: ${stdDev.toFixed(4)}`, textX, textY);
  });
};

/**
 * Render professional footer
 */
const renderFooter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  SCALE: number
) => {
  const footerY = height - padding + Math.round(20 * SCALE);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(11 * SCALE)}px "Segoe UI", sans-serif`;

  const timestamp = new Date().toISOString().split('T')[0];
  ctx.fillText(`Generated on ${timestamp}`, padding, footerY);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Professional Export • 4K Resolution', width - padding - Math.round(300 * SCALE), footerY);
};

/**
 * Convert canvas to PNG blob
 */
export const canvasToPNG = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to PNG'));
    }, 'image/png', 1.0);
  });
};

/**
 * Convert canvas to JPEG blob
 */
export const canvasToJPEG = (canvas: HTMLCanvasElement, quality: number = 0.95): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert canvas to JPEG'));
    }, 'image/jpeg', quality);
  });
};

/**
 * Create professional PDF from canvas
 */
export const canvasToPDF = (
  canvas: HTMLCanvasElement,
  appName: string,
  title: string,
  fileName: string
): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  
  // Set metadata
  pdf.setProperties({
    title: `${appName} - ${title}`,
    subject: fileName,
    author: appName,
    keywords: 'engineering,analytics,report',
    creator: appName
  });
  
  return pdf;
};

/**
 * Download canvas as file
 */
export const downloadCanvasAs = (
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'jpeg' | 'pdf'
): void => {
  const link = document.createElement('a');
  
  if (format === 'pdf') {
    const pdf = canvasToPDF(canvas, 'IdeaLogs', fileName, fileName);
    pdf.save(`${fileName}.pdf`);
  } else {
    const dataUrl = canvas.toDataURL(`image/${format}`);
    link.href = dataUrl;
    link.download = `${fileName}.${format}`;
    link.click();
  }
};

/**
 * Capture a DOM node at a target width/height using html-to-image for pixel-perfect exports.
 * Returns a Blob for PNG/JPEG/SVG. This clones the node, scales it, captures, then cleans up.
 */
export const domCaptureToBlob = async (
  node: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  format: 'png' | 'jpeg' | 'svg',
  backgroundColor: string = '#ffffff',
  quality: number = 1
): Promise<Blob> => {
  // dynamic import to keep bundle size small
  const mod: any = await import('html-to-image');

  // Clone node to avoid altering layout. Use an offscreen container.
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${node.scrollWidth}px`;
  clone.style.height = `${node.scrollHeight}px`;
  clone.style.boxSizing = 'border-box';
  clone.style.background = backgroundColor;
  clone.style.transformOrigin = 'top left';

  const scaleX = targetWidth / Math.max(1, node.scrollWidth || node.clientWidth || 1);
  const scaleY = targetHeight / Math.max(1, node.scrollHeight || node.clientHeight || 1);
  const scale = Math.min(scaleX, scaleY);

  // Apply scaling via CSS transform for the clone
  clone.style.transform = `scale(${scale})`;
  clone.style.pointerEvents = 'none';

  // Wrap clone in a container to preserve visual bounds
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-9999px';
  wrap.style.top = '-9999px';
  wrap.style.width = `${Math.round((node.scrollWidth || node.clientWidth) * scale)}px`;
  wrap.style.height = `${Math.round((node.scrollHeight || node.clientHeight) * scale)}px`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    const options: any = {
      backgroundColor,
      width: Math.round((node.scrollWidth || node.clientWidth) * scale),
      height: Math.round((node.scrollHeight || node.clientHeight) * scale),
      // pixelRatio influences raster output precision
      pixelRatio: scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }
    };

    if (format === 'svg') {
      // html-to-image.toSvg returns an SVG string
      const svgString = await mod.toSvg(clone, options);
      return new Blob([svgString], { type: 'image/svg+xml' });
    }

    if (format === 'png') {
      const dataUrl = await mod.toPng(clone, options);
      return dataURLToBlob(dataUrl);
    }

    // jpeg
    const dataUrl = await mod.toJpeg(clone, { ...options, quality });
    return dataURLToBlob(dataUrl);
  } finally {
    // cleanup
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }
};

const dataURLToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const meta = parts[0];
  const b64 = parts[1];
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png';
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
};

/**
 * Helper: wrap text to fit width
 */
const wrapText = (text: string, font: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';
  
  // Simplified - in production, use proper text measurement
  const avgCharWidth = maxWidth / 20;
  
  words.forEach(word => {
    if ((currentLine + word).length * avgCharWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
};
