
export interface LogData {
  id: string;
  fileName: string;
  fileSize?: number;
  headers: string[];
  rowCount?: number;
  originalRows: Record<string, any>[];
  computedRows: Record<string, any>[];
  uploadedAt?: string;
}

export interface FormulaDefinition {
  name: string;
  expression: string; // e.g. "ABS(A) * 1.2"
}

export interface PlotAnnotation {
  id: string;
  x: string | number;
  y: number;
  text: string;
}

export interface PlotTemplate {
  id: string;
  name: string;
  xAxis: string;
  yAxes: string[];
  title: string;
  lineColor?: string;
  strokeWidth?: number;
  chartType: 'line' | 'area' | 'bar';
  // Configuration properties
  showGrid?: boolean;
  showMinorGrid?: boolean;
  xMin?: string | number;
  xMax?: string | number;
  yMin?: number;
  yMax?: number;
  // Axis Labeling
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisType?: 'number' | 'category';
  savedAt?: string;
  sourceLogId?: string;
}

export interface Stats {
  min: number;
  max: number;
  mean: number;
  stdDev?: number;
}

export interface FileUploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export type Page = 'dashboard' | 'project' | 'templates';
