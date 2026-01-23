
export interface LogData {
  id: string;
  fileName: string;
  headers: string[];
  originalRows: Record<string, any>[];
  computedRows: Record<string, any>[];
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
}

export interface Stats {
  min: number;
  max: number;
  mean: number;
}

export type Page = 'dashboard' | 'project' | 'templates';
