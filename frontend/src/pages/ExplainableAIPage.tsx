import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, ShieldAlert, CheckCircle2, AlertTriangle,
  HelpCircle, Compass, RefreshCw, BarChart2, Info
} from 'lucide-react';
import { ExplainResponse } from '../types';
import { api } from '../services/api';

export const ExplainableAIPage: React.FC = () => {
  const [region, setRegion] = useState<string>('odisha');
  const [forecastDay, setForecastDay] = useState<number>(5);
  const [variable, setVariable] = useState<string>('rainfall');
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Pre-configured scenario presets as requested in Section 39
  const runScenario = (r: string, d: number, v: string) => {
    setRegion(r);
    setForecastDay(d);
    setVariable(v);
  };

  const loadExplanation = async () => {
    try {
      setLoading(true);
      const res = await api.explainPrediction({
        region,
        forecast_day: forecastDay,
        variable,
        temperature: region === 'odisha' ? 29.5 : 34.0,
        rainfall: variable === 'rainfall' ? 45.0 : 5.0,
        pressure: 998.0,
        humidity: 84.0,
        wind_speed: 21.0
      });
      setExplanation(res);
    } catch (err) {
      console.error('Failed to load SHAP explanation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExplanation();
  }, [region, forecastDay, variable]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            Explainable AI — SHAP Feature Attribution &amp; Decision Support
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Understanding why confidence is assigned, identifying dominant uncertainty drivers, and reviewing historical evidence.
          </p>
        </div>

        {/* Preset Operational Scenarios */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Scenario Preset:</span>
          <button
            onClick={() => runScenario('odisha', 5, 'rainfall')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition ${
              region === 'odisha' && forecastDay === 5 ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            Odisha Day 5 (Rainfall)
          </button>
          <button
            onClick={() => runScenario('kerala', 7, 'rainfall')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition ${
              region === 'kerala' && forecastDay === 7 ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            Kerala Day 7 (Monsoon)
          </button>
          <button
            onClick={() => runScenario('rajasthan', 3, 'temperature')}
            className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition ${
              region === 'rajasthan' && forecastDay === 3 ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            Rajasthan Day 3 (Heat)
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-wrap items-center gap-4 text-xs">
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Select Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-3 py-1.5 font-medium"
          >
            <option value="odisha">Odisha Coastal (Bhubaneswar)</option>
            <option value="kerala">Kerala Coast (Kochi)</option>
            <option value="maharashtra">Maharashtra (Mumbai)</option>
            <option value="gujarat">Gujarat (Saurashtra)</option>
            <option value="rajasthan">Rajasthan West (Jodhpur)</option>
            <option value="himachal">Himachal Pradesh (Shimla)</option>
            <option value="bengal">West Bengal (Kolkata)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Forecast Horizon (Lead Day)</label>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 p-0.5 rounded">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <button
                key={d}
                onClick={() => setForecastDay(d)}
                className={`px-2 py-1 rounded font-mono font-bold ${
                  forecastDay === d ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center">
          <button
            onClick={loadExplanation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recompute SHAP Values</span>
          </button>
        </div>
      </div>

      {/* Main Explainable Output Card */}
      {explanation && (
        <div className="space-y-6">
          {/* Top Prediction Summary Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-cyan-400 font-mono tracking-wider">
                  Target Case Analysis:
                </span>
                <h3 className="text-lg font-bold text-white uppercase mt-0.5">
                  {explanation.region} — DAY {explanation.forecast_day}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Forecast Confidence</span>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {explanation.confidence_score}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">
                    {explanation.confidence_category}
                  </span>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Bust Probability</span>
                  <div className="text-xl font-bold font-mono text-rose-400">
                    {(explanation.bust_probability * 100).toFixed(0)}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">
                    {explanation.bust_probability >= 0.5 ? 'CRITICAL' : 'MODERATE'}
                  </span>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Expected Error</span>
                  <div className="text-xl font-bold font-mono text-slate-200">
                    ±{explanation.expected_error}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {variable}
                  </span>
                </div>
              </div>
            </div>

            {/* Scientific Notice: Explicit Labeling Rule */}
            <div className="flex items-center gap-2 mb-4 bg-cyan-950/40 border border-cyan-800/40 rounded-lg p-2.5 text-xs text-cyan-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Methodological Notice:</strong> Attributions represent <em>{explanation.label}</em> (SHAP game-theoretic value allocations).
                They reflect empirical model associations with historical forecast error distributions, not physical causation.
              </span>
            </div>

            {/* SHAP Feature Contribution Bars */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                WHY IS CONFIDENCE LOW? — Ranked Feature Contributions
              </h4>

              <div className="space-y-3">
                {explanation.features.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">
                        {idx + 1}. {item.feature_name}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {item.percentage}% ({item.importance_value})
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                            : idx === 1
                            ? 'bg-gradient-to-r from-amber-500 to-cyan-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentage * 2.2)}%` }}
                      ></div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meteorological Natural-Language Narrative */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Operational Natural-Language Explanation
              </h4>
              <div className="bg-slate-950/90 rounded-lg p-4 border border-cyan-900/50 text-xs text-slate-200 leading-relaxed font-sans">
                &ldquo;{explanation.natural_language_explanation}&rdquo;
              </div>
            </div>

            {/* Historical Verification Evidence as required in Section 39 */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div>
                <span className="text-slate-300 font-semibold">Similar historical meteorological situations:</span>{' '}
                <strong className="text-white font-mono">{explanation.historical_context.similar_historical_situations} cases</strong>
              </div>
              <div>
                <span className="text-slate-300 font-semibold">Average historical forecast error:</span>{' '}
                <strong className="text-white font-mono">{explanation.historical_context.historical_mean_error}</strong>
              </div>
              <div>
                <span className="text-slate-300 font-semibold">Historical bust frequency:</span>{' '}
                <strong className="text-rose-400 font-mono">{explanation.historical_context.historical_bust_rate}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
