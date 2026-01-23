
import React, { useState, useMemo } from 'react';
import LazyChart from './components/LazyChart';
import { LogData, PlotTemplate, Page, PlotAnnotation, FormulaDefinition } from './types';
import { parseCSV, calculateStats } from './services/dataParser';
import { applyFormulas } from './services/formulaEngine';

const INITIAL_TEMPLATES: PlotTemplate[] = [
  { id: 'st_1', name: 'Altitude Stability', xAxis: 'Flight Time_raw', yAxes: ['Altitude', 'Desired Altitude'], title: 'Altitude vs Flight Time', chartType: 'line', strokeWidth: 2, showGrid: true, xAxisLabel: 'Time (s)', yAxisLabel: 'Altitude (m)' },
  { id: 'st_2', name: 'Attitude Stability', xAxis: 'Flight Time_raw', yAxes: ['Phi', 'The', 'Psi'], title: 'Attitude Analysis', chartType: 'line', strokeWidth: 1.5, showGrid: true, xAxisLabel: 'Time (s)', yAxisLabel: 'Deg' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [logs, setLogs] = useState<LogData[]>([]);
  const [templates, setTemplates] = useState<PlotTemplate[]>(INITIAL_TEMPLATES);
  const [logTemplateMap, setLogTemplateMap] = useState<Record<string, string>>({});
  const [customDashboardTitles, setCustomDashboardTitles] = useState<Record<string, string>>({});
  
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
    xAxisType: 'number'
  });

  const [brushKey, setBrushKey] = useState(0);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'project', label: 'Project Plotter', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'templates', label: 'Standardization Lab', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const parsed = await Promise.all(files.map(async f => await parseCSV(f)));
    setLogs(prev => [...prev, ...parsed]);
    if (!selectedLogId && parsed.length > 0) setSelectedLogId(parsed[0].id);
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
    const node = document.getElementById(`export-container-${id}`);
    if (!node) return;
    setIsExporting(id);
    try {
      await new Promise(r => setTimeout(r, 600));
      
      const options = { 
        quality: 1.0, 
        backgroundColor: '#ffffff'
      };
      
      let dataUrl = '';
      // Dynamically import html-to-image so it's code-split and not included in main bundle
      const htmlToImage = await import('html-to-image');
      if (format === 'png') dataUrl = await htmlToImage.toPng(node, options);
      else if (format === 'jpeg') dataUrl = await htmlToImage.toJpeg(node, options);
      else if (format === 'svg') dataUrl = await htmlToImage.toSvg(node, options);
      else if (format === 'pdf') {
        dataUrl = await htmlToImage.toPng(node, options);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<div style="padding:40px; background:#f8fafc; font-family:sans-serif;"><h1 style="font-size:18px; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">OmniLog Engineering Report</h1><img src="${dataUrl}" style="width:100%; border:1px solid #e2e8f0; border-radius:12px; margin-top:20px;"></div><script>window.onload = () => { window.print(); window.close(); }</script>`);
          win.document.close();
        }
        setIsExporting(null);
        return;
      }
      const link = document.createElement('a');
      link.download = `OmniLog_Report_${id}_${new Date().getTime()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed', error);
      alert('Export failed.');
    } finally {
      setIsExporting(null);
    }
  };

  const currentAnnos = annotations[selectedLogId] || [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
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
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-sm">OP</div>
          <span className="font-bold text-lg tracking-tight">OmniLog <span className="text-indigo-400">Pro</span></span>
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
        <div className="p-4 border-t border-slate-800">
          <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 rounded-md text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
            Import Multi-CSV
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10 shrink-0">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{navItems.find(n => n.id === currentPage)?.label}</h2>
          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 uppercase">{logs.length} Datasets Loaded</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {currentPage === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {processedLogs.length === 0 ? (
                <div className="col-span-full h-[60vh] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40">
                  <h3 className="text-xl font-bold text-slate-600 uppercase tracking-tight">Canvas Empty</h3>
                  <p className="text-sm mt-2 font-medium">Please upload flight/sensor log files to begin analysis.</p>
                </div>
              ) : (
                processedLogs.map(log => {
                  const selectedTemplateId = logTemplateMap[log.id] || (templates.length > 0 ? templates[0].id : '');
                  const activeTemp = templates.find(t => t.id === selectedTemplateId) || templates[0];
                  const currentTitle = (customDashboardTitles[log.id] || activeTemp.name).toUpperCase();

                  return (
                    <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative group">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
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
                      </div>
                      
                      <div id={`export-container-${log.id}`} className="bg-white p-6">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                           <div>
                              <span className="text-[9px] font-black text-indigo-500 uppercase block tracking-widest">OmniLog Pro Analytics</span>
                              <span className="text-[11px] font-bold text-slate-800 uppercase">{log.fileName}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTitle} Report</span>
                           </div>
                        </div>

                        <div className="h-80 relative bg-white">
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

                        <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Statistical Summary</h5>
                          <div className="grid grid-cols-1 gap-2">
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
            <div className="flex flex-col gap-8 h-full">
              {/* Horizontal Workbench Controls Bar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs">Workbench Controls</h3>
                  <div className="flex gap-4">
                    <button onClick={() => setShowFormulaHelp(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Formula Documentation
                    </button>
                    <button onClick={resetPlotter} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Clear All</button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-end gap-6">
                  <div className="min-w-[150px] flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Target Context</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 outline-none font-medium" value={selectedLogId} onChange={(e) => setSelectedLogId(e.target.value)}>
                      <option value="">Select a log file...</option>
                      {processedLogs.map(l => <option key={l.id} value={l.id}>{l.fileName}</option>)}
                    </select>
                  </div>

                  <div className="min-w-[150px] flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Plot Heading</label>
                    <input type="text" value={plotterConfig.title} onChange={e => setPlotterConfig({...plotterConfig, title: e.target.value.toUpperCase()})} placeholder="WORKBENCH EXPORT" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none font-medium uppercase" />
                  </div>

                  <div className="min-w-[150px] flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Horizontal Map (X)</label>
                    <select className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 outline-none font-medium" value={plotterConfig.xAxis} onChange={(e) => setPlotterConfig({...plotterConfig, xAxis: e.target.value})}>
                      <option value="">Select Column...</option>
                      {availableColumns.map(h => (
                        <React.Fragment key={h}>
                          <option value={h}>{h}</option>
                          <option value={`${h}_raw`}>{h} (Raw Label)</option>
                        </React.Fragment>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[150px] flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Metric Selection (Y)</label>
                    <div className="h-[40px] overflow-y-auto border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 custom-scrollbar shadow-inner text-xs">
                       <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {availableColumns.map(h => (
                            <label key={h} className="flex items-center gap-2 whitespace-nowrap cursor-pointer hover:text-indigo-600 transition-colors">
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
                                className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300" 
                              />
                              {h}
                            </label>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* Grid Controls */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Grids</label>
                    <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={plotterConfig.showGrid} 
                          onChange={e => setPlotterConfig({...plotterConfig, showGrid: e.target.checked})}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300" 
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Major</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={plotterConfig.showMinorGrid} 
                          onChange={e => setPlotterConfig({...plotterConfig, showMinorGrid: e.target.checked})}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300" 
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Minor</span>
                      </label>
                    </div>
                  </div>

                  {/* Formula Builder Mini-Form */}
                  <div className="min-w-[300px] flex-[2] bg-slate-50 p-2 rounded-xl border border-slate-200 flex gap-2 shadow-inner">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      className="w-20 border-none bg-transparent outline-none text-xs font-bold uppercase placeholder:text-slate-300"
                      value={newFormula.name}
                      onChange={e => setNewFormula({...newFormula, name: e.target.value.replace(/\s+/g, '_')})}
                    />
                    <input 
                      type="text" 
                      placeholder="Expression e.g. [Alt] * 2" 
                      className="flex-1 border-none bg-transparent outline-none text-xs font-medium placeholder:text-slate-300"
                      value={newFormula.expression}
                      onChange={e => setNewFormula({...newFormula, expression: e.target.value})}
                    />
                    <button 
                      onClick={handleAddFormula}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                    >
                      Add Metric
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {['png', 'jpeg', 'pdf'].map(fmt => (
                      <button key={fmt} onClick={() => exportPlot('project-main', fmt as any)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-indigo-600 transition-all">
                        {isExporting === 'project-main' ? '...' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
                
                {formulas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formulas.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-[10px] font-bold border border-indigo-200 shadow-sm animate-in slide-in-from-left-2">
                        <span className="opacity-50 font-mono">ƒx</span>
                        <span>{f.name}</span>
                        <button onClick={() => removeFormula(idx)} className="hover:text-rose-500 w-4 h-4 flex items-center justify-center rounded-full hover:bg-indigo-200">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vertical Plot Area Section */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <div id="export-container-project-main" className="flex flex-col bg-white capture-container max-w-[1200px] mx-auto">
                    <div className="mb-8 flex justify-between items-start border-b border-slate-100 pb-4">
                       <div className="flex-1 min-w-0 pr-4">
                          <span className="text-[10px] font-black text-indigo-500 uppercase block tracking-[0.2em] mb-1">OMNILOG PRO ANALYTICS</span>
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight uppercase truncate">{plotterConfig.title || 'WORKBENCH EXPORT'}</h3>
                          <span className="text-[11px] font-bold text-slate-400 uppercase truncate block mt-1 tracking-wider">{currentLog?.fileName || 'No Data Selected'}</span>
                       </div>
                       <div className="text-right shrink-0">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">WORKBENCH</span>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mt-1">REPORT</span>
                       </div>
                    </div>

                    <div className="w-full aspect-[3/2] rounded-xl mb-12 relative overflow-hidden bg-slate-50/30">
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                           <h3 className="text-xl font-bold text-slate-600 uppercase tracking-tight">Canvas Empty</h3>
                           <p className="text-sm mt-2 font-medium">Please configure Workbench controls to generate plot.</p>
                        </div>
                      )}
                    </div>

                    {currentLog && plotterConfig.yAxes && plotterConfig.yAxes.length > 0 && (
                      <div className="border-t border-slate-100 pt-8">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-6">AUTOMATED STATISTICAL SUMMARY</h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                           {plotterConfig.yAxes.map((y, idx) => {
                             const s = calculateStats(currentLog.computedRows, y);
                             if (!s) return null;
                             return (
                               <div key={y} className="flex flex-col bg-slate-50 rounded-xl p-5 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-[11px] font-bold text-slate-800 uppercase truncate">{y}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase mb-1">Min</span><span className="text-[12px] font-mono font-bold text-emerald-600">{s.min.toFixed(4)}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase mb-1">Max</span><span className="text-[12px] font-mono font-bold text-rose-600">{s.max.toFixed(4)}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] text-slate-400 font-bold uppercase mb-1">Mean</span><span className="text-[12px] font-mono font-bold text-indigo-600">{s.mean.toFixed(4)}</span></div>
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
                         <button onClick={() => setTemplates(templates.filter(t => t.id !== temp.id))} className="text-[10px] font-black text-rose-500 px-6 py-2 rounded-xl hover:bg-rose-50 uppercase tracking-widest transition-all">Discard Template</button>
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
