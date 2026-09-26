import React, { useState } from 'react';
import { Code2, Server, Terminal, Copy, Check, ExternalLink, Network } from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    { method: 'GET', path: '/api/health', desc: 'System status, active model version, and data health audit.' },
    { method: 'GET', path: '/api/weather/current', desc: 'Instantaneous observed surface atmospheric parameters across monitoring stations.' },
    { method: 'GET', path: '/api/weather/forecast', desc: '1-10 Day NWP medium-range forecast with AI expected error and confidence.' },
    { method: 'GET', path: '/api/confidence', desc: 'Spatial confidence index summary for selected forecast lead time.' },
    { method: 'GET', path: '/api/bust-probability', desc: 'Forecast bust probability rankings across synoptic divisions.' },
    { method: 'GET', path: '/api/regional-risk', desc: 'Error-prone region identification and Forecast Reliability Risk classification.' },
    { method: 'GET', path: '/api/historical-error', desc: 'MAE, RMSE, bias, and historical bust distributions for verified forecast pairs.' },
    { method: 'POST', path: '/api/predict', desc: 'ML scoring endpoint for custom atmospheric and synoptic feature inputs.' },
    { method: 'POST', path: '/api/explain', desc: 'SHAP game-theoretic feature attribution and natural language explanation.' },
    { method: 'POST', path: '/api/datasets/upload', desc: 'Upload CSV datasets with automated structural and suitability inspection.' },
    { method: 'POST', path: '/api/models/train', desc: 'Trigger chronological time-series training and probability calibration.' },
    { method: 'GET', path: '/api/models/metrics', desc: 'Retrieve independent holdout test evaluation metrics (MAE, ROC-AUC, Brier).' },
    { method: 'GET', path: '/api/config', desc: 'Inspect configurable forecast bust thresholds and confidence brackets.' },
    { method: 'POST', path: '/api/config', desc: 'Update operational bust thresholds and scheduler refresh intervals.' },
  ];

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            Operational REST API &amp; Architecture Reference
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Production FastAPI endpoints for weather ingestion, ML forecast error prediction, bust classification, and explainability.
          </p>
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition"
        >
          <span>Open Interactive Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* System Architecture Diagram Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            System Architecture &amp; Data Pipeline
          </h3>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          <pre>{`                    OPERATIONAL USER / METEOROLOGIST
                                   |
                                   v
                      REACT + TYPESCRIPT DASHBOARD
                                   |
                                   v
                          FASTAPI REST BACKEND
                                   |
       +---------------------------+---------------------------+
       |                           |                           |
       v                           v                           v
 Weather Service               ML Service                  Database
(Open-Meteo / NWP / Obs)     (XGBoost / Calibrated)       (PostgreSQL / PostGIS)
       |                           |                           |
       v                           v                           |
 Feature Engineering       Model A: Error Regressor            |
 (Atmospheric Soundings)   Model B: Bust Classifier            |
       |                           |                           |
       +---------------------------+---------------------------+
                                   |
                                   v
                        Forecast Confidence Engine
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
           Confidence Score (0-100)        SHAP Explainability
           [VERY HIGH, HIGH, MED, LOW]    ("Model-derived factors")`}</pre>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          REST API Specification Endpoints
        </h3>

        <div className="divide-y divide-slate-800 text-xs">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    ep.method === 'GET'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-slate-200 font-bold">{ep.path}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-400">
                <span className="text-[11px] line-clamp-1">{ep.desc}</span>
                <button
                  onClick={() => copyToClipboard(`curl http://localhost:8000${ep.path}`, idx)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                  title="Copy curl command"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
