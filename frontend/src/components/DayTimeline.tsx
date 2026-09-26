import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { DayForecastItem } from '../types';

interface Props {
  days: DayForecastItem[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const DayTimeline: React.FC<Props> = ({ days, selectedDay, onSelectDay }) => {
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'VERY HIGH': return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';
      case 'HIGH': return 'text-teal-400 border-teal-500/50 bg-teal-950/30';
      case 'MEDIUM': return 'text-amber-400 border-amber-500/50 bg-amber-950/30';
      case 'LOW': return 'text-orange-400 border-orange-500/50 bg-orange-950/30';
      case 'VERY LOW': return 'text-rose-400 border-rose-500/50 bg-rose-950/30';
      default: return 'text-slate-400 border-slate-700 bg-slate-800/30';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Medium-Range Predictability Horizon (Day 1 – Day 10)
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Click lead day to inspect uncertainty decay
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {days.map((d) => {
          const isSelected = d.day === selectedDay;
          return (
            <button
              key={d.day}
              onClick={() => onSelectDay(d.day)}
              className={`flex flex-col items-center justify-between p-2.5 rounded-lg border text-center transition-all duration-150 ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                DAY {d.day}
              </div>

              {/* Confidence Score Pill */}
              <div className={`my-1.5 px-2 py-0.5 rounded text-sm font-extrabold font-mono border ${getBadgeColor(d.confidence_category)}`}>
                {d.confidence_score}%
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                ±{d.expected_error}
              </div>

              <div className="mt-1 text-[9px] font-semibold text-slate-500 uppercase tracking-tighter">
                Bust: {(d.bust_probability * 100).toFixed(0)}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
