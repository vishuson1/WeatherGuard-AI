import React from 'react';
import { Shield, AlertCircle, MapPin, Gauge, TrendingUp, HelpCircle } from 'lucide-react';

interface Props {
  confidenceScore: number;
  confidenceCategory: string;
  bustProbability: number;
  highRiskCount: number;
  totalRegions: number;
  expectedError: number;
  selectedLeadDay: number;
}

export const MetricCards: React.FC<Props> = ({
  confidenceScore,
  confidenceCategory,
  bustProbability,
  highRiskCount,
  totalRegions,
  expectedError,
  selectedLeadDay
}) => {
  const getConfidenceColor = (cat: string) => {
    switch (cat) {
      case 'VERY HIGH': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'HIGH': return 'text-teal-400 border-teal-500/30 bg-teal-950/20';
      case 'MEDIUM': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'LOW': return 'text-orange-400 border-orange-500/30 bg-orange-950/20';
      case 'VERY LOW': return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
      default: return 'text-slate-300 border-slate-700 bg-slate-900/40';
    }
  };

  const getBustColor = (prob: number) => {
    if (prob >= 0.50) return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
    if (prob >= 0.25) return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. CURRENT CONFIDENCE */}
      <div className={`rounded-xl border p-4 backdrop-blur-md transition-all duration-200 ${getConfidenceColor(confidenceCategory)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            Forecast Confidence
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
            Day {selectedLeadDay}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight font-mono">
            {confidenceScore}%
          </span>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/60 border border-current">
            {confidenceCategory}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 line-clamp-1">
          Calibrated reliability index from XGBoost error distributions
        </p>
      </div>

      {/* 2. BUST PROBABILITY */}
      <div className={`rounded-xl border p-4 backdrop-blur-md transition-all duration-200 ${getBustColor(bustProbability)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Bust Probability
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
            P(Error &gt; Thresh)
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight font-mono">
            {(bustProbability * 100).toFixed(0)}%
          </span>
          <span className="text-xs font-medium text-slate-300">
            {bustProbability >= 0.5 ? 'CRITICAL RISK' : bustProbability >= 0.25 ? 'MODERATE RISK' : 'LOW RISK'}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 line-clamp-1">
          Probability of extreme verification divergence
        </p>
      </div>

      {/* 3. HIGH RISK REGIONS */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-400" />
            Reliability Risk Areas
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {totalRegions} Monitored
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-amber-400 font-mono">
            {highRiskCount}
          </span>
          <span className="text-xs text-slate-400">
            / {totalRegions} zones elevated risk
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 line-clamp-1">
          Regions with bust prob &gt; 50% or low confidence
        </p>
      </div>

      {/* 4. EXPECTED FORECAST ERROR */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Expected Forecast Error
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
            MAE Model A
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-cyan-400 font-mono">
            ±{expectedError}
          </span>
          <span className="text-xs text-slate-400">
            expected synoptic bias
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 line-clamp-1">
          ML regression expected magnitude on Day {selectedLeadDay}
        </p>
      </div>
    </div>
  );
};
