import React from 'react';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { HealthStatus } from '../types';

interface Props {
  health: HealthStatus | null;
  loading?: boolean;
}

export const LiveStatusBadge: React.FC<Props> = ({ health, loading }) => {
  const isLive = health?.mode === 'LIVE';
  const isHealthy = health?.data_health === 'GOOD';

  return (
    <div className="flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-700/60 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-inner">
      {/* Live / Demo indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        </span>
        <span className={`font-semibold tracking-wider uppercase ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isLive ? '● LIVE OPERATIONAL' : '● DEMO / RESEARCH MODE'}
        </span>
      </div>

      <div className="h-3.5 w-px bg-slate-700"></div>

      {/* Update latency */}
      <div className="text-slate-400">
        Updated: <span className="text-slate-200 font-mono">{health?.last_data_update || 'Just now'}</span>
      </div>

      <div className="h-3.5 w-px bg-slate-700"></div>

      {/* Data Health */}
      <div className="flex items-center gap-1.5">
        {isHealthy ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className={isHealthy ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
          DATA: {health?.data_health || 'AUDITING'}
        </span>
      </div>

      <div className="h-3.5 w-px bg-slate-700"></div>

      {/* Model Version */}
      <div className="hidden md:flex items-center gap-1 text-slate-400">
        <Activity className="w-3.5 h-3.5 text-cyan-400" />
        <span>Model:</span>
        <span className="text-cyan-300 font-mono">{health?.active_model || 'Loading...'}</span>
      </div>
    </div>
  );
};
