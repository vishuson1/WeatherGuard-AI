import React, { useState, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, ShieldCheck, Zap, Info,
  RefreshCw, CloudRain, Wind, Thermometer, Gauge
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';

import { MetricCards } from '../components/MetricCards';
import { DayTimeline } from '../components/DayTimeline';
import { InteractiveMap } from '../components/InteractiveMap';
import { WeatherEventBadge } from '../components/WeatherEventBadge';
import { RegionalRiskResponse, ForecastResponse, RegionalRiskItem } from '../types';
import { api } from '../services/api';

interface Props {
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigateTab }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [riskData, setRiskData] = useState<RegionalRiskResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('odisha');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load operational data
  const loadData = async (day: number) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [riskRes, fcstRes] = await Promise.all([
        api.getRegionalRisk(day),
        api.getForecast(selectedRegion)
      ]);
      setRiskData(riskRes);
      setForecastData(fcstRes);
    } catch (err: any) {
      console.error('Failed to load dashboard operational data', err);
      setErrorMsg(err.message || 'Error connecting to backend services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDay);
  }, [selectedDay, selectedRegion]);

  // Derive top-level metrics
  const regions = riskData?.regions || [];
  const avgConfidence = regions.length
    ? Math.round(regions.reduce((acc, r) => acc + r.confidence_score, 0) / regions.length)
    : 78;
  const maxBustProb = regions.length
    ? Math.max(...regions.map((r) => r.bust_probability))
    : 0.28;
  const avgExpectedError = regions.length
    ? +(regions.reduce((acc, r) => acc + r.expected_error, 0) / regions.length).toFixed(1)
    : 3.4;

  const currentCategory =
    avgConfidence >= 80 ? 'HIGH' : avgConfidence >= 60 ? 'MEDIUM' : 'LOW';

  // Lead-time chart data from forecast days
  const chartData = (forecastData?.days || []).map((d) => ({
    name: `Day ${d.day}`,
    day: d.day,
    confidence: d.confidence_score,
    bust_prob: +(d.bust_probability * 100).toFixed(0),
    expected_error: d.expected_error,
    rainfall: d.rainfall,
    temp: d.temperature
  }));

  // Selected Day specific forecast details
  const activeDayDetail = (forecastData?.days || []).find((d) => d.day === selectedDay) || forecastData?.days?.[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Operational Decision Support Console
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              SYNOPTIC DOMAIN: SOUTH ASIA / INDIA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time evaluation of Medium-Range NWP reliability, atmospheric bust vulnerability, and explainable uncertainty.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            <option value="odisha">Odisha Coastal (Bhubaneswar)</option>
            <option value="kerala">Kerala Coast (Kochi)</option>
            <option value="maharashtra">Maharashtra (Mumbai/Konkan)</option>
            <option value="gujarat">Gujarat (Saurashtra)</option>
            <option value="rajasthan">Rajasthan (Jodhpur/Thar)</option>
            <option value="himachal">Himachal Pradesh (Shimla)</option>
            <option value="bengal">West Bengal (Kolkata)</option>
            <option value="assam">Assam (Guwahati)</option>
            <option value="delhi">Delhi NCR</option>
            <option value="tamilnadu">Tamil Nadu (Chennai)</option>
          </select>

          <button
            onClick={() => loadData(selectedDay)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMsg} - Fallback telemetry active.</span>
        </div>
      )}

      {/* 4 TOP METRIC CARDS */}
      <MetricCards
        confidenceScore={avgConfidence}
        confidenceCategory={currentCategory}
        bustProbability={maxBustProb}
        highRiskCount={riskData?.high_risk_count || 0}
        totalRegions={regions.length}
        expectedError={avgExpectedError}
        selectedLeadDay={selectedDay}
      />

      {/* INTERACTIVE GEOGRAPHICAL MAP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Synoptic Map &amp; Reliability Risk Areas
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click on any station for deep factor attribution
          </span>
        </div>
        <InteractiveMap
          regions={regions}
          selectedDay={selectedDay}
          onSelectDay={(d) => setSelectedDay(d)}
        />
      </div>

      {/* DAY 1 - DAY 10 DYNAMIC PREDICTABILITY TIMELINE */}
      <DayTimeline
        days={forecastData?.days || []}
        selectedDay={selectedDay}
        onSelectDay={(d) => setSelectedDay(d)}
      />

      {/* BOTTOM SECTION: 2-COLUMN OPERATIONAL ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Uncertainty & Error Trend by Lead Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Confidence Decay vs Lead Time (Days 1–10)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {forecastData?.region || 'Odisha'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  name="Confidence (%)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConf)"
                />
                <Area
                  type="monotone"
                  dataKey="bust_prob"
                  name="Bust Probability (%)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBust)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Dynamical model divergence expands past Day 4. Notice the inverse relationship between confidence and bust probability.
          </p>
        </div>

        {/* Selected Day Atmospheric State & Weather Event Detection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  Synoptic Diagnostics — Day {selectedDay} ({activeDayDetail?.date})
                </h3>
              </div>
              {activeDayDetail && (
                <WeatherEventBadge
                  event={activeDayDetail.weather_event}
                  isInferred={activeDayDetail.is_inferred_event}
                />
              )}
            </div>

            {/* Current atmospheric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Temperature</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {activeDayDetail?.temperature}°C
                </div>
                <span className="text-[10px] text-slate-400">NWP Model Value</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span>Precipitation</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {activeDayDetail?.rainfall} mm
                </div>
                <span className="text-[10px] text-slate-400">24h Accumulation</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Gauge className="w-3.5 h-3.5 text-teal-400" />
                  <span>Pressure</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {activeDayDetail?.pressure} hPa
                </div>
                <span className="text-[10px] text-slate-400">Mean SLP</span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100">
                  {activeDayDetail?.wind_speed} m/s
                </div>
                <span className="text-[10px] text-slate-400">10m Max Gust</span>
              </div>
            </div>

            {/* Model Verification Narrative */}
            <div className="bg-slate-950/90 rounded-lg p-3.5 border border-cyan-950 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-cyan-300 block mb-1">
                AI Reliability Summary for {forecastData?.region}:
              </span>
              The operational ensemble projects a Day {selectedDay} forecast confidence of{' '}
              <strong className="text-white">{activeDayDetail?.confidence_score}%</strong> (
              <span className="text-cyan-400 font-bold">{activeDayDetail?.confidence_category}</span>) with an expected error magnitude of{' '}
              <strong className="text-white">±{activeDayDetail?.expected_error}</strong> and bust probability of{' '}
              <strong className="text-rose-400">{(Number(activeDayDetail?.bust_probability || 0) * 100).toFixed(0)}%</strong>.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('explainable_ai')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Inspect SHAP Explainability &rarr;
            </button>
            <button
              onClick={() => onNavigateTab('forecast_busts')}
              className="text-slate-400 hover:text-slate-200"
            >
              Analyze Historical Bust Frequency &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
