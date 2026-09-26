import React, { useState, useEffect } from 'react';
import { Map, Layers, RefreshCw, Info } from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';
import { RegionalRiskResponse, RegionalRiskItem } from '../types';
import { api } from '../services/api';

export const ConfidenceMapPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(3);
  const [riskData, setRiskData] = useState<RegionalRiskResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (day: number) => {
    try {
      setLoading(true);
      const res = await api.getRegionalRisk(day);
      setRiskData(res);
    } catch (err) {
      console.error('Failed to load map data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDay);
  }, [selectedDay]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            Interactive Synoptic Confidence &amp; Reliability Risk Map
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Spatial mapping of numerical forecast uncertainty, radar-ringed forecast bust zones, and regional risk factors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 px-2 font-semibold">Lead Day:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2 py-1 rounded font-mono font-bold transition ${
                  selectedDay === d ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(selectedDay)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Forecast Reliability Risk Layer:</strong> Highlights regions where predicted forecast error is high or bust probability &gt; 50%.
            This designates forecast uncertainty, not physical ground hazard alone.
          </span>
        </div>
        <span className="font-mono text-cyan-400 font-bold shrink-0">
          {riskData?.high_risk_count || 0} zones elevated risk on Day {selectedDay}
        </span>
      </div>

      {/* Full-view Leaflet Map */}
      <InteractiveMap
        regions={riskData?.regions || []}
        selectedDay={selectedDay}
        onSelectDay={(d) => setSelectedDay(d)}
      />
    </div>
  );
};
