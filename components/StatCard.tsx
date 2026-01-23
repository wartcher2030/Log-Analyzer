
import React from 'react';
import { Stats } from '../types';

interface Props {
  label: string;
  stats: Stats;
}

export const StatCard: React.FC<Props> = ({ label, stats }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-slate-400">MIN</p>
          <p className="text-sm font-semibold text-slate-800">{stats.min.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">MAX</p>
          <p className="text-sm font-semibold text-slate-800">{stats.max.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">MEAN</p>
          <p className="text-sm font-semibold text-slate-800">{stats.mean.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
};
