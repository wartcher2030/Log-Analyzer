
import React, { useState, useMemo, useEffect } from 'react';
import LazyChart from './components/LazyChart';
import { LogData, PlotTemplate, Page, PlotAnnotation, FormulaDefinition, FileUploadProgress } from './types';
import { parseCSV, parseMultipleFiles, calculateStats } from './services/dataParser';
import { applyFormulas } from './services/formulaEngine';
import { useLocalStorage } from './services/database';
import { renderChartToCanvas, downloadCanvasAs } from './services/exportService';

const INITIAL_TEMPLATES: PlotTemplate[] = [
  { id: 'st_1', name: 'Altitude Stability', xAxis: 'Flight Time_raw', yAxes: ['Altitude', 'Desired Altitude'], title: 'Altitude vs Flight Time', chartType: 'line', strokeWidth: 2, showGrid: true, xAxisLabel: 'Time (s)', yAxisLabel: 'Altitude (m)' },
  { id: 'st_2', name: 'Attitude Stability', xAxis: 'Flight Time_raw', yAxes: ['Phi', 'The', 'Psi'], title: 'Attitude Analysis', chartType: 'line', strokeWidth: 1.5, showGrid: true, xAxisLabel: 'Time (s)', yAxisLabel: 'Deg' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [logs, setLogs] = useState<LogData[]>([]);
  const [templates, setTemplates] = useState<PlotTemplate[]>(() => {
    const savedTemplates = useLocalStorage.loadTemplates();
    return savedTemplates.length > 0 ? savedTemplates : INITIAL_TEMPLATES;
  });
  const [logTemplateMap, setLogTemplateMap] = useState<Record<string, string>>({});
  const [customDashboardTitles, setCustomDashboardTitles] = useState<Record<string, string>>({});
  const [appName, setAppName] = useState<string>('IdeaLogs');
  const [isEditingAppName, setIsEditingAppName] = useState<boolean>(false);
  
  // File upload state
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Project Plotter State
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [formulas, setFormulas] = useState<FormulaDefinition[]>([]);
  const [newFormula, setNewFormula] = useState<FormulaDefinition>({ name: '', expression: '' });
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);

  const [annotations, setAnnotations] = useState<Record<string, PlotAnnotation[]>>({});
  const [plotterConfig, setPlotterConfig] = useState<Partial<PlotTemplate>>({
    title: 'WORKBENCH EXPORT',
    xAxis: '',
    yAxes: [],
    strokeWidth: 2,
    showGrid: true,
    showMinorGrid: false,
    xMin: '',
    xMax: '',
    yMin: undefined,
    yMax: undefined,
    xAxisLabel: '',
    yAxisLabel: '',
    xAxisType: 'number',
    chartHeight: 600
  });

  const [brushKey, setBrushKey] = useState(0);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Persist templates to localStorage whenever they change
  useEffect(() => {
    templates.forEach(template => {
      useLocalStorage.saveTemplate(template);
    });
  }, [templates]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'project', label: 'Project Plotter', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'templates', label: 'Standardization Lab', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    setIsUploading(true);
    setUploadError('');
    const files = Array.from(e.target.files) as File[];

    try {
      // Initialize progress tracking for all files
      setUploadProgress(files.map((f, idx) => ({
        fileIndex: idx,
        fileName: f.name,
        progress: 0,
        status: 'pending' as const
      })));

      const result = await parseMultipleFiles(files, (fileIndex, progress) => {
        setUploadProgress(prev => {
          const updated = [...prev];
          updated[fileIndex].progress = progress;
          if (progress === 100) {
            updated[fileIndex].status = 'success';
          } else {
            updated[fileIndex].status = 'loading';
          }
          return updated;
        });
      });

      // Handle successful uploads
      if (result.successful.length > 0) {
        setLogs(prev => [...prev, ...result.successful]);
        if (!selectedLogId && result.successful.length > 0) {
          setSelectedLogId(result.successful[0].id);
        }
      }

      // Handle failures
      if (result.failed.length > 0) {
        const errorSummary = result.failed
          .map(f => `${f.fileName}: ${f.error}`)
          .join('\n');
        
        setUploadProgress(prev => prev.map((p, idx) => {
          const failedFile = result.failed.find(f => f.fileName === p.fileName);
          return failedFile 
            ? { ...p, status: 'error' as const, error: failedFile.error }
            : p;
        }));

        if (result.successful.length === 0) {
          setUploadError(`Failed to upload ${result.failed.length} file(s):\n${errorSummary}`);
        } else {
          setUploadError(`${result.successful.length} file(s) uploaded, but ${result.failed.length} failed:\n${errorSummary}`);
        }
      } else {
        // Clear progress after successful completion
        setTimeout(() => {
          setUploadProgress([]);
        }, 2000);
      }
    } catch (error) {
      setUploadError(`Upload failed: ${String(error).substring(0, 100)}`);
      setUploadProgress(prev => prev.map(p => ({ ...p, status: 'error' as const })));
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleAddFormula = () => {
    if (!newFormula.name || !newFormula.expression) return;
    setFormulas(prev => [...prev, newFormula]);
    setNewFormula({ name: '', expression: '' });
  };

  const removeFormula = (index: number) => {
    setFormulas(prev => prev.filter((_, i) => i !== index));
  };

  const resetPlotter = () => {
    setPlotterConfig({
      title: 'WORKBENCH EXPORT',
      xAxis: '',
      yAxes: [],
      strokeWidth: 2,
      showGrid: true,
      showMinorGrid: false,
      xAxisLabel: '',
      yAxisLabel: '',
      xAxisType: 'number'
    });
    setBrushKey(prev => prev + 1);
    setFormulas([]);
  };

  const processedLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      computedRows: applyFormulas(log.originalRows, formulas)
    }));
  }, [logs, formulas]);

  const currentLog = processedLogs.find(l => l.id === selectedLogId);
  const availableColumns = useMemo(() => {
    if (!currentLog) return [];
    const computedKeys = formulas.map(f => f.name);
    return [...currentLog.headers, ...computedKeys];
  }, [currentLog, formulas]);

  const handleChartClick = (state: any) => {
    if (!state || !state.activeLabel || !state.activePayload || state.activePayload.length === 0) return;
    const text = prompt("Enter annotation text for this point:");
    if (!text) return;
    const newAnno: PlotAnnotation = {
      id: Math.random().toString(36).substr(2, 9),
      x: state.activeLabel,
      y: state.activePayload[0].value,
      text: text
    };
    setAnnotations(prev => ({
      ...prev,
      [selectedLogId]: [...(prev[selectedLogId] || []), newAnno]
    }));
  };

  const exportPlot = async (id: string, format: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    setIsExporting(id);
    try {
      // Get the current log and config based on which export triggered
      let exportLog: LogData | undefined;
      let exportConfig: Partial<PlotTemplate> | undefined;
      let exportTitle: string = appName;
      
      if (id === 'project-main') {
        exportLog = currentLog;
        exportConfig = plotterConfig;
        exportTitle = plotterConfig.title || 'Engineering Report';
      } else {
        exportLog = logs.find(l => l.id === id);
        exportConfig = templates.find(t => t.id === logTemplateMap[id]);
        if (!exportConfig) exportConfig = INITIAL_TEMPLATES[0];
      }
      
      if (!exportLog || !exportConfig || !exportConfig.xAxis || !exportConfig.yAxes || exportConfig.yAxes.length === 0) {
        alert('Please configure plot before exporting');
        setIsExporting(null);
        return;
      }
      
      // Determine container size to preserve dashboard/project aspect ratio,
      // then scale up to 4K while keeping layout proportions.
      let targetWidth = 3840;
      let targetHeight = 2160;
      try {
        const containerId = id === 'project-main' ? 'export-container-project-main' : `export-container-${id}`;
        const node = document.getElementById(containerId);
        if (node) {
          const cw = node.clientWidth || node.scrollWidth || 1200;
          const ch = node.clientHeight || node.scrollHeight || 800;
          const scale = targetWidth / Math.max(600, cw);
          targetHeight = Math.max(800, Math.round(ch * scale));
        }
      } catch (e) {
        // fallback to default 4K
      }

      // Render professional canvas scaled from the visible container dimensions
      const canvas = await renderChartToCanvas(
        exportLog.computedRows,
        exportConfig,
        COLORS,
        appName,
        exportLog.fileName,
        targetWidth,
        targetHeight,
        true
      );
      
      // Download based on format. Prefer DOM capture (pixel-perfect) for image exports so
      // exported images match the dashboard DOM rendering. Fallback to canvas renderer
      // if DOM capture fails.
      const fileName = `${appName}_${exportTitle}_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'pdf') {
        // For PDF, prefer DOM capture to PNG then embed into PDF for fidelity
        try {
          const containerId = id === 'project-main' ? 'export-container-project-main' : `export-container-${id}`;
          const node = document.getElementById(containerId);
          if (node) {
            const scale = targetWidth / Math.max(600, node.clientWidth || node.scrollWidth || 1200);
            const pngBlob = await import('./services/exportService').then(m => m.domCaptureToBlob(node, Math.round(node.scrollWidth * scale), Math.round((node.clientHeight || node.scrollHeight) * scale), 'png', '#ffffff', 1));
            const { canvasToPDF } = await import('./services/exportService');
            // create an image element from blob then draw to canvas for PDF
            const imgUrl = URL.createObjectURL(pngBlob);
            const img = new Image();
            img.src = imgUrl;
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = img.width;
            tmpCanvas.height = img.height;
            const tctx = tmpCanvas.getContext('2d');
            if (!tctx) throw new Error('Failed to get canvas context');
            tctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(imgUrl);
            const pdf = canvasToPDF(tmpCanvas, appName, exportTitle, exportLog.fileName);
            pdf.save(`${fileName}.pdf`);
          } else {
            // fallback to canvas pdf
            const { canvasToPDF } = await import('./services/exportService');
            const pdf = canvasToPDF(canvas, appName, exportTitle, exportLog.fileName);
            pdf.save(`${fileName}.pdf`);
          }
        } catch (e) {
          const { canvasToPDF } = await import('./services/exportService');
          const pdf = canvasToPDF(canvas, appName, exportTitle, exportLog.fileName);
          pdf.save(`${fileName}.pdf`);
        }
      } else if (format === 'png' || format === 'jpeg') {
        // Try DOM capture for exact match
        try {
          const containerId = id === 'project-main' ? 'export-container-project-main' : `export-container-${id}`;
          const node = document.getElementById(containerId);
          if (!node) throw new Error('Container not found for DOM capture');
          const scale = targetWidth / Math.max(600, node.clientWidth || node.scrollWidth || 1200);
          const blob = await import('./services/exportService').then(m => m.domCaptureToBlob(node, Math.round(node.scrollWidth * scale), Math.round((node.clientHeight || node.scrollHeight) * scale), format === 'png' ? 'png' : 'jpeg', '#ffffff', 0.95));
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileName}.${format === 'png' ? 'png' : 'jpeg'}`;
          link.click();
          URL.revokeObjectURL(link.href);
        } catch (err) {
          // fallback to canvas renderer
          if (format === 'png') {
            const { canvasToPNG } = await import('./services/exportService');
            const blob = await canvasToPNG(canvas);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
          } else {
            const { canvasToJPEG } = await import('./services/exportService');
            const blob = await canvasToJPEG(canvas, 0.95);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.jpeg`;
            link.click();
            URL.revokeObjectURL(link.href);
          }
        }
      }
    } catch (error) {
      console.error('Export failed', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const captureScreenshot = async (id: string, format: 'png' | 'jpeg' | 'svg') => {
    setIsExporting(id + '-screenshot');
    try {
      const nodeId = id === 'project-main' ? 'export-container-project-main' : `export-container-${id}`;
      const node = document.getElementById(nodeId);
      if (!node) { alert('Could not find chart container to capture'); setIsExporting(null); return; }

      await (document as any).fonts?.ready;
      const htmlToImage = await import('html-to-image');
      const options: any = { backgroundColor: '#ffffff', quality: 1 };

      // Use explicit width/height to capture full content
      options.width = node.scrollWidth || node.clientWidth;
      options.height = node.scrollHeight || node.clientHeight;

      let dataUrl = '';
      if (format === 'png') dataUrl = await htmlToImage.toPng(node, options);
      else if (format === 'jpeg') dataUrl = await htmlToImage.toJpeg(node, options);
      else if (format === 'svg') dataUrl = await htmlToImage.toSvg(node, options);

      if (!dataUrl) throw new Error('Capture failed');

      const link = document.createElement('a');
      const fileName = `${appName}_${id === 'project-main' ? 'workbench' : 'dashboard'}_${new Date().toISOString().split('T')[0]}_screenshot.${format}`;
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    } catch (e) {
      console.error('Screenshot capture failed', e);
      alert('Screenshot capture failed');
    } finally {
      setIsExporting(null);
    }
  };

  const currentAnnos = annotations[selectedLogId] || [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-auto text-slate-900">
      {/* Formula Help Modal */}
      {showFormulaHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Engineering Formula Lab</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Advanced syntax guide for custom log computed parameters</p>
              </div>
              <button onClick={() => setShowFormulaHelp(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              <section>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Core Syntax Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block mb-2">Column Referencing</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Wrap column names in square brackets to use their row values. <br/><code className="text-indigo-600 font-bold bg-white px-1 rounded">[Altitude]</code></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block mb-2">Math Operators</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Use standard JS operators: <code className="text-indigo-600 font-bold">+ - * / ** %</code>. Use parentheses to define order of operations.</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Available Functions</h4>
                <div className="space-y-3">
                  <div className="p-4 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <code className="text-sm font-black text-indigo-600">ABS(expression)</code>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Absolute Value</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Returns the non-negative value of the input expression.</p>
                    <code className="block bg-slate-50 p-2 rounded text-[10px] text-slate-600">ABS([Desired_Alt] - [Actual_Alt])</code>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <code className="text-sm font-black text-indigo-600">IF(condition, true_val, false_val)</code>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Conditional Logic</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Evaluates condition and returns first value if true, second if false.</p>
                    <code className="block bg-slate-50 p-2 rounded text-[10px] text-slate-600">IF([Battery] &lt; 14.8, 1, 0)</code>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <code className="text-sm font-black text-indigo-600">LPF([Column], alpha)</code>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Low-Pass Filter</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Applies a first-order low pass filter where alpha (0 to 1) is the smoothing factor.</p>
                    <code className="block bg-slate-50 p-2 rounded text-[10px] text-slate-600">LPF([IMU_AccX], 0.05)</code>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Common Engineering Examples</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setNewFormula({ name: 'Error_Diff', expression: 'ABS([Target] - [Current])' }); setShowFormulaHelp(false); }}
                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
                  >
                    <span className="text-xs font-bold text-indigo-800 block mb-1 uppercase tracking-tight">Delta Calculation</span>
                    <code className="text-[10px] text-indigo-600 font-mono">ABS([Target] - [Current])</code>
                  </button>
                  <button 
                    onClick={() => { setNewFormula({ name: 'Health_Bit', expression: 'IF([Voltage] > 11.1, 1, 0)' }); setShowFormulaHelp(false); }}
                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
                  >
                    <span className="text-xs font-bold text-indigo-800 block mb-1 uppercase tracking-tight">Status Mapping</span>
                    <code className="text-[10px] text-indigo-600 font-mono">{'IF([Voltage] > 11.1, 1, 0)'}</code>
                  </button>
                  <button 
                    onClick={() => { setNewFormula({ name: 'Smoothed_PSI', expression: 'LPF([PSI_Raw], 0.1)' }); setShowFormulaHelp(false); }}
                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
                  >
                    <span className="text-xs font-bold text-indigo-800 block mb-1 uppercase tracking-tight">Signal Cleaning</span>
                    <code className="text-[10px] text-indigo-600 font-mono">LPF([PSI_Raw], 0.1)</code>
                  </button>
                  <button 
                    onClick={() => { setNewFormula({ name: 'Power_Watts', expression: '[Current] * [Voltage]' }); setShowFormulaHelp(false); }}
                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
                  >
                    <span className="text-xs font-bold text-indigo-800 block mb-1 uppercase tracking-tight">Derived Metrics</span>
                    <code className="text-[10px] text-indigo-600 font-mono">[Current] * [Voltage]</code>
                  </button>
                </div>
              </section>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowFormulaHelp(false)} className="px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">Close Documentation</button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 space-y-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-base shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {isEditingAppName ? (
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  onBlur={() => setIsEditingAppName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingAppName(false)}
                  autoFocus
                  className="font-bold text-lg tracking-tight bg-slate-800 text-white rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-400"
                />
              ) : (
                <span
                  onClick={() => setIsEditingAppName(true)}
                  className="font-bold text-lg tracking-tight text-white cursor-pointer hover:text-indigo-400 transition-colors inline-block truncate"
                >
                  {appName}
                </span>
              )}
              <span className="text-indigo-400 text-xs font-semibold block">Analytics</span>
            </div>
          </div>
          {isEditingAppName && (
            <p className="text-[10px] text-slate-400 italic">Click to edit app name</p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 rounded-md text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
            {isUploading ? 'Uploading...' : 'Import Multi-CSV'}
            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} accept=".csv" />
          </label>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {uploadProgress.map((file) => (
                <div key={`${file.fileIndex}-${file.fileName}`} className="bg-slate-800 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-300 truncate">{file.fileName}</span>
                    {file.status === 'success' && <span className="text-[10px] text-emerald-400">✓</span>}
                    {file.status === 'error' && <span className="text-[10px] text-rose-400">✗</span>}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        file.status === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="bg-rose-950 border border-rose-800 rounded-md p-2">
              <p className="text-[10px] text-rose-200 font-medium whitespace-pre-wrap">{uploadError}</p>
              <button
                onClick={() => setUploadError('')}
                className="text-[10px] text-rose-300 hover:text-rose-100 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10 shrink-0">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{navItems.find(n => n.id === currentPage)?.label}</h2>
          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase">{logs.length} Datasets Loaded</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {currentPage === 'dashboard' && (
            <div className="flex flex-col gap-6 max-w-full">
              {processedLogs.length === 0 ? (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40">
                  <h3 className="text-xl font-bold text-slate-600 uppercase tracking-tight">Canvas Empty</h3>
                  <p className="text-sm mt-2 font-medium">Please upload flight/sensor log files to begin analysis.</p>
                </div>
              ) : (
                processedLogs.map(log => {
                  const selectedTemplateId = logTemplateMap[log.id] || (templates.length > 0 ? templates[0].id : '');
                  const activeTemp = templates.find(t => t.id === selectedTemplateId) || templates[0];
                  const currentTitle = (customDashboardTitles[log.id] || activeTemp.name).toUpperCase();

                  return (
                    <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative group w-full h-auto">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                        <div className="flex-1 min-w-0 pr-4">
                          <input 
                            value={currentTitle} 
                            onChange={(e) => setCustomDashboardTitles(prev => ({ ...prev, [log.id]: e.target.value.toUpperCase() }))}
                            className="font-bold text-slate-800 text-sm truncate uppercase bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-200 rounded px-1 w-full"
                          />
                          <select 
                            value={selectedTemplateId}
                            onChange={(e) => setLogTemplateMap(prev => ({ ...prev, [log.id]: e.target.value }))}
                            className="text-[10px] font-black text-indigo-600 bg-transparent border-none p-0 cursor-pointer outline-none uppercase"
                          >
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0">
                          {['png', 'jpeg', 'pdf'].map(fmt => (
                            <button 
                              key={fmt}
                              onClick={() => exportPlot(log.id, fmt as any)}
                              className="text-[9px] font-extrabold uppercase px-2 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all active:scale-95"
                            >
                              {isExporting === log.id ? '...' : fmt}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 ml-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0">
                          {['png', 'jpeg', 'svg'].map(fmt => (
                            <button 
                              key={fmt}
                              onClick={() => captureScreenshot(log.id, fmt as any)}
                              title={`Screenshot ${fmt.toUpperCase()}`}
                              className="text-[9px] font-extrabold uppercase px-2 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all active:scale-95"
                            >
                              S-{fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div id={`export-container-${log.id}`} className="bg-white p-6 flex flex-col w-full">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 shrink-0">
                           <div>
                              <span className="text-[9px] font-black text-indigo-500 uppercase block tracking-widest">{appName} Analytics</span>
                              <span className="text-[11px] font-bold text-slate-800 uppercase">{log.fileName}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTitle} Report</span>
                           </div>
                        </div>

                        <div className="w-full h-96 relative bg-white">
                          <LazyChart
                            data={log.computedRows}
                            template={activeTemp}
                            colors={COLORS}
                            isExporting={isExporting === log.id}
                            onChartClick={handleChartClick}
                            annotations={currentAnnos}
                            brushKey={brushKey}
                          />
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 shrink-0">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Statistical Summary</h5>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {activeTemp.yAxes.map((y, idx) => {
                               const s = calculateStats(log.computedRows, y);
                               if (!s) return null;
                               return (
                                 <div key={y} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100 group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                      <span className="text-[10px] font-bold text-slate-700 uppercase">{y}</span>
                                    </div>
                                    <div className="flex gap-6">
                                      <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Min</span><span className="text-xs font-mono font-bold text-emerald-600">{s.min.toFixed(4)}</span></div>
                                      <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Max</span><span className="text-xs font-mono font-bold text-rose-600">{s.max.toFixed(4)}</span></div>
                                      <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Mean</span><span className="text-xs font-mono font-bold text-indigo-600">{s.mean.toFixed(4)}</span></div>
                                    </div>
                                 </div>
                               );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {currentPage === 'project' && (
            <div className="flex flex-col gap-6 flex-1 min-h-0">
              {/* Improved Workbench Controls - Organized Layout */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                {/* Header with actions */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Workbench Configuration</h3>
                  <div className="flex gap-3">
                    <button onClick={() => setShowFormulaHelp(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Help
                    </button>
                    <button onClick={resetPlotter} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Reset</button>
                  </div>
                </div>

                {/* Main content grid */}
                <div className="p-4 space-y-4">
                  {/* Row 1: Data Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-wider">📊 Data Source</label>
                      <select 
                        className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none font-medium hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                        value={selectedLogId} 
                        onChange={(e) => setSelectedLogId(e.target.value)}
                      >
                        <option value="">Select log file...</option>
                        {processedLogs.map(l => <option key={l.id} value={l.id}>{l.fileName} ({l.computedRows?.length || 0} rows)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-wider">📏 Height (px)</label>
                      <input
                        type="number"
                        min={200}
                        max={1200}
                        value={plotterConfig.chartHeight as any || 600}
                        onChange={e => setPlotterConfig({ ...plotterConfig, chartHeight: Number(e.target.value) })}
                        className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none font-medium hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Axis Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-wider">➡️ X Axis (Horizontal)</label>
                      <select 
                        className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none font-medium hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                        value={plotterConfig.xAxis} 
                        onChange={(e) => setPlotterConfig({...plotterConfig, xAxis: e.target.value})}
                      >
                        <option value="">Select column...</option>
                        {availableColumns.map(h => (
                          <React.Fragment key={h}>
                            <option value={h}>{h}</option>
                            <option value={`${h}_raw`}>{h} (Raw)</option>
                          </React.Fragment>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-wider">📈 Plot Title</label>
                      <input 
                        type="text" 
                        value={plotterConfig.title} 
                        onChange={e => setPlotterConfig({...plotterConfig, title: e.target.value.toUpperCase()})} 
                        placeholder="ANALYSIS REPORT" 
                        className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none font-medium uppercase hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Row 3: Y Axes Selection (Large) */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-wider">📊 Y Axis Metrics (Select Multiple)</label>
                    <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50/50 max-h-[120px] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableColumns.map(h => (
                          <label key={h} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={plotterConfig.yAxes?.includes(h)} 
                              onChange={e => {
                                const current = plotterConfig.yAxes || [];
                                setPlotterConfig({
                                  ...plotterConfig,
                                  yAxes: e.target.checked ? [...current, h] : current.filter(y => y !== h)
                                });
                              }}
                              className="w-4 h-4 rounded-md text-indigo-600 border-slate-300 cursor-pointer" 
                            />
                            <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{h}</span>
                          </label>
                        ))}
                      </div>
                      {(plotterConfig.yAxes?.length || 0) === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">Select metrics to display</p>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Display Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={plotterConfig.showGrid} 
                            onChange={e => setPlotterConfig({...plotterConfig, showGrid: e.target.checked})}
                            className="w-4 h-4 rounded-md text-indigo-600 border-slate-300" 
                          />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">Major Grid</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={plotterConfig.showMinorGrid} 
                            onChange={e => setPlotterConfig({...plotterConfig, showMinorGrid: e.target.checked})}
                            className="w-4 h-4 rounded-md text-indigo-600 border-slate-300" 
                          />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">Minor Grid</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">X Label</label>
                        <input 
                          type="text" 
                          value={plotterConfig.xAxisLabel || ''} 
                          onChange={e => setPlotterConfig({...plotterConfig, xAxisLabel: e.target.value})} 
                          placeholder="e.g., Time (s)" 
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Y Label</label>
                        <input 
                          type="text" 
                          value={plotterConfig.yAxisLabel || ''} 
                          onChange={e => setPlotterConfig({...plotterConfig, yAxisLabel: e.target.value})} 
                          placeholder="e.g., Value (units)" 
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Formula Builder */}
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-lg border-2 border-dashed border-indigo-200">
                    <label className="text-[10px] font-black text-indigo-700 uppercase block mb-2 tracking-wider">🔧 Create Derived Metric</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Name" 
                        className="flex-shrink-0 w-24 border border-indigo-200 bg-white rounded-lg px-3 py-2 text-xs font-bold uppercase placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-300"
                        value={newFormula.name}
                        onChange={e => setNewFormula({...newFormula, name: e.target.value.replace(/\s+/g, '_')})}
                      />
                      <input 
                        type="text" 
                        placeholder="Formula: [Col1] * 2, ABS([Col2] - [Col3]), etc." 
                        className="flex-1 border border-indigo-200 bg-white rounded-lg px-3 py-2 text-xs font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-300"
                        value={newFormula.expression}
                        onChange={e => setNewFormula({...newFormula, expression: e.target.value})}
                      />
                      <button 
                        onClick={handleAddFormula}
                        className="flex-shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Active Formulas */}
                  {formulas.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-indigo-100/40 rounded-lg border border-indigo-200">
                      {formulas.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md animate-in slide-in-from-left-2">
                          <span className="opacity-70 font-mono">ƒx</span>
                          <span>{f.name}</span>
                          <button onClick={() => removeFormula(idx)} className="hover:bg-indigo-500 w-5 h-5 flex items-center justify-center rounded-full transition-colors">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Export Controls */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider self-center mr-1">Export:</span>
                      {['png', 'jpeg', 'pdf'].map(fmt => (
                        <button 
                          key={fmt} 
                          onClick={() => exportPlot('project-main', fmt as any)} 
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-sm"
                        >
                          {isExporting === 'project-main' ? '...' : fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider self-center mr-1">Screenshot:</span>
                      {['png', 'jpeg', 'svg'].map(fmt => (
                        <button 
                          key={fmt} 
                          onClick={() => captureScreenshot('project-main', fmt as any)} 
                          className="px-2.5 py-1.5 bg-white text-slate-700 rounded-lg text-[9px] font-bold uppercase border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={async () => {
                        if (!selectedLogId) { alert('Select a log first'); return; }
                        const current = processedLogs.find(l => l.id === selectedLogId);
                        if (!current) { alert('Selected log not found'); return; }
                        const debug = await import('./services/exportService').then(m => m.prepareExportDebug(current.computedRows, plotterConfig as any));
                        const blob = new Blob([JSON.stringify(debug, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${appName}_project_debug.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }} 
                      className="ml-auto px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase border border-slate-300 hover:bg-slate-300 transition-all shadow-sm"
                    >
                      Debug Info
                    </button>
                  </div>
                </div>
              </div>

              {/* Plot Display Area */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                  <div id="export-container-project-main" className="flex flex-col bg-white capture-container w-full mx-auto">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 shrink-0">
                       <div>
                          <span className="text-[9px] font-black text-indigo-500 uppercase block tracking-widest">{appName} Analytics</span>
                          <span className="text-[11px] font-bold text-slate-800 uppercase">{currentLog?.fileName || 'No Data Selected'}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plotterConfig.title || 'ANALYSIS REPORT'}</span>
                       </div>
                    </div>

                    <div className="w-full h-96 relative bg-white">
                      {currentLog && plotterConfig.xAxis && (plotterConfig.yAxes?.length || 0) > 0 ? (
                        <LazyChart
                          data={currentLog.computedRows}
                          template={plotterConfig as any}
                          colors={COLORS}
                          isExporting={isExporting === selectedLogId}
                          onChartClick={handleChartClick}
                          annotations={currentAnnos}
                          brushKey={brushKey}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h4 className="text-lg font-bold text-slate-600 uppercase tracking-tight mb-1">Canvas Empty</h4>
                            <p className="text-sm font-medium text-slate-500">Configure data source and metrics above to generate plot</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {currentLog && plotterConfig.yAxes && plotterConfig.yAxes.length > 0 && (
                      <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 shrink-0">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Statistical Summary</h5>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {plotterConfig.yAxes.map((y, idx) => {
                            const s = calculateStats(currentLog.computedRows, y);
                            if (!s) return null;
                            return (
                              <div key={y} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-100 group">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                  <span className="text-[10px] font-bold text-slate-700 uppercase">{y}</span>
                                </div>
                                <div className="flex gap-6">
                                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Min</span><span className="text-xs font-mono font-bold text-emerald-600">{s.min.toFixed(4)}</span></div>
                                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Max</span><span className="text-xs font-mono font-bold text-rose-600">{s.max.toFixed(4)}</span></div>
                                  <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Mean</span><span className="text-xs font-mono font-bold text-indigo-600">{s.mean.toFixed(4)}</span></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'templates' && (
             <div className="max-w-5xl mx-auto space-y-6 pb-20">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-2xl text-slate-800 uppercase tracking-tight">Standardization Lab</h3>
                      <p className="text-sm text-slate-400 font-medium">Define automated templates with custom axis labeling and parameter groups.</p>
                   </div>
                   <button onClick={() => setTemplates([{ id: Date.now().toString(), name: 'New Standard Template', xAxis: '', yAxes: [], title: '', chartType: 'line', strokeWidth: 2, showGrid: true, showMinorGrid: false, xAxisLabel: '', yAxisLabel: '' }, ...templates])} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all uppercase">New Template</button>
                </div>
                {templates.map((temp, i) => (
                   <div key={temp.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div>
                               <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Template Identifier</label>
                               <input value={temp.name} onChange={e => { const n = [...templates]; n[i].name = e.target.value; setTemplates(n); }} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 font-bold outline-none uppercase" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">X-Axis Label</label>
                                  <input value={temp.xAxisLabel} onChange={e => { const n = [...templates]; n[i].xAxisLabel = e.target.value; setTemplates(n); }} placeholder="e.g. Time (s)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" />
                               </div>
                               <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Y-Axis Label</label>
                                  <input value={temp.yAxisLabel} onChange={e => { const n = [...templates]; n[i].yAxisLabel = e.target.value; setTemplates(n); }} placeholder="e.g. Deg/s" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" />
                               </div>
                            </div>
                            {/* Template Grid Toggles */}
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={temp.showGrid} 
                                    onChange={e => { const n = [...templates]; n[i].showGrid = e.target.checked; setTemplates(n); }} 
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300" 
                                  />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase">Major Grid</span>
                               </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={temp.showMinorGrid} 
                                    onChange={e => { const n = [...templates]; n[i].showMinorGrid = e.target.checked; setTemplates(n); }} 
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300" 
                                  />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase">Minor Grid</span>
                               </label>
                            </div>
                            <div>
                               <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Horizontal Map (X)</label>
                               <select value={temp.xAxis} onChange={e => { const n = [...templates]; n[i].xAxis = e.target.value; setTemplates(n); }} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 outline-none font-medium">
                                  <option value="">Select Column...</option>
                                  {(logs[0]?.headers || ['Flight Time']).map(h => (
                                     <React.Fragment key={h}>
                                        <option value={h}>{h}</option>
                                        <option value={`${h}_raw`}>{h} (Raw Label)</option>
                                     </React.Fragment>
                                  ))}
                               </select>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Parameter Group (Y-Axes)</label>
                            <div className="h-56 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50 custom-scrollbar shadow-inner">
                               {(logs[0]?.headers || []).map(h => (
                                  <label key={h} className="flex items-center gap-3 p-2 text-xs hover:bg-white cursor-pointer rounded-lg transition-all mb-1 font-medium text-slate-600 border border-transparent hover:border-slate-200">
                                     <input 
                                        type="checkbox" 
                                        checked={temp.yAxes.includes(h)} 
                                        onChange={e => {
                                           const n = [...templates];
                                           n[i].yAxes = e.target.checked ? [...temp.yAxes, h] : temp.yAxes.filter(y => y !== h);
                                           setTemplates(n);
                                        }} 
                                        className="w-4 h-4 rounded text-indigo-600" 
                                     /> 
                                     {h}
                                  </label>
                               ))}
                               {!logs[0] && <p className="text-[10px] text-slate-400 italic text-center py-4">Upload a log file to view available columns</p>}
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-50">
                         <button onClick={() => { useLocalStorage.deleteTemplate(temp.id); setTemplates(templates.filter(t => t.id !== temp.id)); }} className="text-[10px] font-black text-rose-500 px-6 py-2 rounded-xl hover:bg-rose-50 uppercase tracking-widest transition-all">Discard Template</button>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
