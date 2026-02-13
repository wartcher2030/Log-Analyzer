import React, { useEffect, useState, useMemo, memo } from 'react';
import { PlotTemplate, PlotAnnotation } from '../types';

interface Props {
  data: Record<string, any>[];
  template: Partial<PlotTemplate> | PlotTemplate;
  colors?: string[];
  isExporting?: boolean;
  onChartClick?: (state: any) => void;
  annotations?: PlotAnnotation[];
  brushKey?: number;
}

const LazyChartComponent: React.FC<Props> = ({ 
  data, 
  template, 
  colors = [], 
  isExporting, 
  onChartClick, 
  annotations = [], 
  brushKey 
}) => {
  const [R, setR] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadRecharts = async () => {
      try {
        const mod = await import('recharts');
        if (mounted) {
          setR(mod);
          setLoadError(null);
        }
      } catch (err) {
        if (mounted) {
          setLoadError('Failed to load charting library');
          console.error('Failed to load recharts:', err);
        }
      }
    };
    
    loadRecharts();
    return () => { mounted = false; };
  }, []);

  // Memoize chart data processing - limit for performance
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const maxPoints = 10000;
    if (data.length > maxPoints) {
      const step = Math.ceil(data.length / maxPoints);
      return data.filter((_, i) => i % step === 0);
    }
    return data;
  }, [data]);

  if (!R) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400">
        <span className="text-sm font-medium">
          {loadError ? `Error: ${loadError}` : 'Loading chart...'}
        </span>
      </div>
    );
  }

  const { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    Brush, 
    ReferenceDot, 
    Label 
  } = R;

  const temp = template as Record<string, any>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={processedData} 
        onClick={onChartClick} 
        margin={{ bottom: 20, top: 10, left: 10, right: 10 }}
      >
        {temp.showGrid && (
          <CartesianGrid 
            strokeDasharray={temp.showMinorGrid ? "1 1" : "3 3"} 
            vertical={temp.showMinorGrid} 
            stroke="#f1f5f9" 
          />
        )}
        <XAxis
          dataKey={temp.xAxis}
          type={temp.xAxisType === 'number' ? 'number' : 'category'}
          domain={[temp.xMin || 'auto', temp.xMax || 'auto']}
          fontSize={10}
          stroke="#94a3b8"
          isAnimationActive={false}
        >
          <Label 
            value={temp.xAxisLabel} 
            position="insideBottom" 
            offset={-5} 
            fontSize={10} 
            fill="#64748b" 
            fontWeight="bold" 
          />
        </XAxis>
        <YAxis 
          domain={[temp.yMin || 'auto', temp.yMax || 'auto']} 
          fontSize={10} 
          stroke="#94a3b8"
          isAnimationActive={false}
        >
          <Label 
            value={temp.yAxisLabel} 
            angle={-90} 
            position="insideLeft" 
            style={{ textAnchor: 'middle' }} 
            fontSize={10} 
            fill="#64748b" 
            fontWeight="bold" 
          />
        </YAxis>
        <Tooltip 
          contentStyle={{ 
            fontSize: '11px', 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' 
          }} 
        />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
        {(temp.yAxes || []).map((y: string, idx: number) => (
          <Line 
            key={`line-${y}`}
            type="monotone" 
            dataKey={y} 
            stroke={colors[idx % colors.length]} 
            strokeWidth={temp.strokeWidth || 2} 
            dot={false} 
            isAnimationActive={false}
          />
        ))}
        {annotations.map((anno) => (
          <ReferenceDot 
            key={`anno-${anno.id}`}
            x={anno.x} 
            y={anno.y} 
            r={6} 
            fill="#6366f1" 
            stroke="#fff" 
            strokeWidth={3}
          >
            <Label 
              value={anno.text} 
              position="top" 
              offset={10} 
              fontSize={11} 
              fill="#1e293b" 
              fontWeight="bold" 
            />
          </ReferenceDot>
        ))}
        {!isExporting && (
          <Brush 
            key={`brush-${brushKey}`}
            dataKey={temp.xAxis} 
            height={20} 
            stroke="#e2e8f0" 
            fill="#f8fafc" 
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Memoize component to prevent unnecessary re-renders
export const LazyChart = memo(LazyChartComponent, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.template === next.template &&
    prev.colors === next.colors &&
    prev.isExporting === next.isExporting &&
    prev.annotations === next.annotations &&
    prev.brushKey === next.brushKey
  );
});

export default LazyChart;
