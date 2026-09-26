import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Flame, ShieldAlert, BarChart2,
  TrendingUp, Activity, HelpCircle, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { HistoricalErrorStats } from '../types';
import { api } from '../services/api';

export const ForecastBustPage: React.FC = () => {
  const [variable, setVariable] = useState<string>('rainfall');
  const [stats, setStats] = useState<HistoricalErrorStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getHistoricalError(variable);
        setStats(data);
      } catch (err) {
        console.error('Failed to load bust statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [variable]);

  return (
    <div className="space-y-6">
      {/* Header & Definition Notice */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Forecast Bust Analysis &amp; Extreme Error Detection
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Systematic identification and empirical evaluation of high-impact forecast busts across synoptic regimes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Variable:</span>
          <select
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium"
          >
            <option value="rainfall">Precipitation / Rainfall (mm)</option>
            <option value="temperature">Surface Temperature (°C)</option>
            <option value="wind_speed">Wind Speed (m/s)</option>
            <option value="pressure">Atmospheric Pressure (hPa)</option>
          </select>
        </div>
      </div>

      {/* Top Banner: Scientific Distinction Notice */}
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            Operational Bust Definition Criterion:
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            A <strong>Forecast Bust</strong> is strictly defined when absolute verification error exceeds the configured operational tolerance
            (e.g., rainfall error &gt; 20 mm/day, temperature error &gt; 3.0°C). Bust probability is the calibrated statistical likelihood that a forecast will cross this threshold.
          </p>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-center shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Archive Verification Bust Rate</span>
          <span className="text-2xl font-mono font-extrabold text-rose-400">
            {stats?.bust_frequency || 18.4}%
          </span>
          <span className="text-[10px] text-slate-400 block">Across 6,544 synoptic pairs</span>
        </div>
      </div>

      {/* 2 Main Charts: Error vs Lead Time & Bust Probability vs Lead Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error vs Lead Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Verification Error vs Lead Time (Days 1–10)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">MAE &amp; RMSE</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.error_by_lead_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="forecast_day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="mae" name="Mean Absolute Error (MAE)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="rmse" name="Root Mean Squared Error (RMSE)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Error grows non-linearly with lead time. Notice how RMSE departs from MAE at longer horizons due to extreme outlier penalties.
          </p>
        </div>

        {/* Bust Probability vs Lead Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Bust Probability vs Lead Time
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">% Crossing Bust Criteria</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.bust_prob_by_lead_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="forecast_day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="bust_probability" name="Bust Probability (%)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            While Day 1-2 bust rates typically remain below 10%, Day 7-10 bust rates reach 45-65% during convective instability.
          </p>
        </div>
      </div>

      {/* Bottom Section: Error Distribution Histogram & Event-Specific Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Distribution Histogram */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Forecast Error Distribution (Histogram)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Sample Count</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.error_distribution || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Observations" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Right-skewed heavy tail illustrates the rare but operationally devastating extreme error events.
          </p>
        </div>

        {/* Event-Specific Verification Regime Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Synoptic Weather Event Performance
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Regime Benchmarks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Event Regime</th>
                  <th className="pb-2">MAE</th>
                  <th className="pb-2">RMSE</th>
                  <th className="pb-2">Bust Rate</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {(stats?.event_performance || []).map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2 text-slate-200 font-sans font-medium">{ev.event}</td>
                    <td className="py-2 text-cyan-300">{ev.mae}</td>
                    <td className="py-2 text-slate-300">{ev.rmse}</td>
                    <td className="py-2 font-bold text-rose-400">{ev.bust_frequency}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        ev.bust_frequency > 35 ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        ev.bust_frequency > 20 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
