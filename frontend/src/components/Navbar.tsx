import React from 'react';
import {
  Compass, CloudSun, Map, AlertTriangle, History,
  BrainCircuit, BarChart3, Database, Code2, Settings,
  Radio
} from 'lucide-react';
import { LiveStatusBadge } from './LiveStatusBadge';
import { HealthStatus } from '../types';

export type NavTab =
  | 'dashboard'
  | 'live_forecast'
  | 'confidence_map'
  | 'forecast_busts'
  | 'historical_verification'
  | 'explainable_ai'
  | 'model_performance'
  | 'datasets'
  | 'api_docs'
  | 'admin';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  health: HealthStatus | null;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab, health }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'live_forecast', label: 'Live Forecast', icon: CloudSun },
    { id: 'confidence_map', label: 'Confidence Map', icon: Map },
    { id: 'forecast_busts', label: 'Forecast Busts', icon: AlertTriangle },
    { id: 'historical_verification', label: 'Verification', icon: History },
    { id: 'explainable_ai', label: 'Explainable AI', icon: BrainCircuit },
    { id: 'model_performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'api_docs', label: 'API', icon: Code2 },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-mono">
                WeatherGuard<span className="text-cyan-400">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              AI Medium-Range Forecast Confidence &amp; Bust Detection System
            </p>
          </div>
        </div>

        {/* System Telemetry Badge */}
        <LiveStatusBadge health={health} />
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none border-t border-slate-900">
        <nav className="flex items-center gap-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
