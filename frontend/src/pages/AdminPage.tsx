import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Shield, RefreshCw, CheckCircle2,
  AlertTriangle, Database, Activity, Save
} from 'lucide-react';
import { api } from '../services/api';

export const AdminPage: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Form states
  const [tempThresh, setTempThresh] = useState<number>(3.0);
  const [rainThresh, setRainThresh] = useState<number>(20.0);
  const [windThresh, setWindThresh] = useState<number>(7.0);
  const [presThresh, setPresThresh] = useState<number>(3.0);
  const [refreshInterval, setRefreshInterval] = useState<number>(15);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfg, status] = await Promise.all([
        api.getConfig(),
        api.getSystemStatus()
      ]);
      setConfig(cfg);
      setSystemStatus(status);

      if (cfg?.bust_thresholds) {
        setTempThresh(cfg.bust_thresholds.temperature_c);
        setRainThresh(cfg.bust_thresholds.rainfall_mm);
        setWindThresh(cfg.bust_thresholds.wind_speed_ms);
        setPresThresh(cfg.bust_thresholds.pressure_hpa);
      }
      if (cfg?.refresh_interval_minutes) {
        setRefreshInterval(cfg.refresh_interval_minutes);
      }
    } catch (err) {
      console.error('Failed to load admin settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Saving updated thresholds...');
      await api.updateConfig({
        bust_thresholds: {
          temperature_c: tempThresh,
          rainfall_mm: rainThresh,
          wind_speed_ms: windThresh,
          pressure_hpa: presThresh
        },
        refresh_interval_minutes: refreshInterval
      });
      setSaveStatus('Operational configurations successfully persisted to database!');
      await loadData();
    } catch (err: any) {
      setSaveStatus(`Failed to update configuration: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Administration &amp; Operational Threshold Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure meteorological verification bust criteria, confidence scoring brackets, scheduler intervals, and active models.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-800 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* System Telemetry & Pipeline Health Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Operational Ingestion &amp; Infrastructure Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data Ingestion Provider</span>
            <span className="font-mono text-cyan-300 font-bold mt-1 block">
              {systemStatus?.data_provider || 'Open-Meteo & NWP Ensembles'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Operational Mode</span>
            <span className="font-mono text-emerald-400 font-bold mt-1 block">
              {systemStatus?.mode_label || 'LIVE OPERATIONAL'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Last Scheduled Ingestion</span>
            <span className="font-mono text-slate-200 mt-1 block">
              {systemStatus?.last_successful_update ? new Date(systemStatus.last_successful_update).toLocaleTimeString() : 'Recent'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data Quality Audit</span>
            <span className="font-mono text-emerald-400 font-bold mt-1 block">
              {systemStatus?.data_health_status || 'GOOD'}
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSaveConfig} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Configurable Forecast Bust Criteria
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Defines the quantitative verification error cutoff for classifying a forecast as an operational bust.
            </p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Thresholds</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
            <label className="text-slate-300 font-semibold block">
              Rainfall Bust Threshold (mm/day)
            </label>
            <input
              type="number"
              step="1"
              value={rainThresh}
              onChange={(e) => setRainThresh(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-500">Default: 20 mm/day error</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
            <label className="text-slate-300 font-semibold block">
              Temperature Bust Threshold (°C)
            </label>
            <input
              type="number"
              step="0.5"
              value={tempThresh}
              onChange={(e) => setTempThresh(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-500">Default: 3.0°C error</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
            <label className="text-slate-300 font-semibold block">
              Wind Speed Bust Threshold (m/s)
            </label>
            <input
              type="number"
              step="0.5"
              value={windThresh}
              onChange={(e) => setWindThresh(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-500">Default: 7.0 m/s error</span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
            <label className="text-slate-300 font-semibold block">
              Pressure Bust Threshold (hPa)
            </label>
            <input
              type="number"
              step="0.5"
              value={presThresh}
              onChange={(e) => setPresThresh(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-500">Default: 3.0 hPa error</span>
          </div>
        </div>

        {/* Scheduler Refresh Interval */}
        <div className="pt-2 border-t border-slate-800 text-xs">
          <label className="text-slate-300 font-semibold block mb-1">
            Data Refresh &amp; Re-scoring Interval (Minutes)
          </label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min="1"
              max="120"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-white rounded px-3 py-1.5 font-mono text-sm w-32"
            />
            <span className="text-slate-400">minutes between automated ingestion ticks</span>
          </div>
        </div>
      </form>
    </div>
  );
};
