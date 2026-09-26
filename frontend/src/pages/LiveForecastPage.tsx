import React, { useState, useEffect } from 'react';
import { CloudSun, RefreshCw, Thermometer, Droplets, Gauge, Wind, CloudRain, AlertCircle, Shield } from 'lucide-react';
import { ForecastResponse, CurrentWeatherItem } from '../types';
import { WeatherEventBadge } from '../components/WeatherEventBadge';
import { api } from '../services/api';

export const LiveForecastPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('odisha');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (reg: string) => {
    try {
      setLoading(true);
      const [fcstRes, currentList] = await Promise.all([
        api.getForecast(reg),
        api.getCurrentWeather(reg)
      ]);
      setForecast(fcstRes);
      if (currentList.length > 0) setCurrentWeather(currentList[0]);
    } catch (err) {
      console.error('Failed to load forecast data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRegion);
  }, [selectedRegion]);

  const getConfStyle = (cat: string) => {
    switch (cat) {
      case 'VERY HIGH': return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'HIGH': return 'text-teal-400 bg-teal-950/60 border-teal-500/40';
      case 'MEDIUM': return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'LOW': return 'text-orange-400 bg-orange-950/60 border-orange-500/40';
      case 'VERY LOW': return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      default: return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-cyan-400" />
            Medium-Range Operational Weather Forecast (Day 1–10)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official NWP deterministic predictions augmented with AI Expected Error, Bust Probability, and Confidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-medium"
          >
            <option value="odisha">Odisha (Bhubaneswar/Puri)</option>
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
            onClick={() => loadData(selectedRegion)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Real-time Atmospheric Telemetry Bar */}
      {currentWeather && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Instantaneous Surface Observations: {currentWeather.location_name}
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Source: {currentWeather.source}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</span>
                <div className="text-lg font-bold font-mono text-white">{currentWeather.temperature}°C</div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              <Droplets className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Humidity</span>
                <div className="text-lg font-bold font-mono text-white">{currentWeather.humidity}%</div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              <Gauge className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pressure</span>
                <div className="text-lg font-bold font-mono text-white">{currentWeather.pressure} hPa</div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              <Wind className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Wind Speed</span>
                <div className="text-lg font-bold font-mono text-white">{currentWeather.wind_speed} m/s</div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Precipitation</span>
                <div className="text-lg font-bold font-mono text-white">{currentWeather.rainfall} mm</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day 1 to Day 10 Comprehensive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {(forecast?.days || []).map((d) => (
          <div
            key={d.day}
            className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 backdrop-blur-md hover:border-cyan-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    DAY {d.day}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    +{d.lead_time_hours}h
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {d.date.slice(5)}
                </span>
              </div>

              {/* Weather Forecast Values */}
              <div className="space-y-1.5 mb-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Temp:</span>
                  <span className="font-mono font-bold text-slate-100">{d.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rainfall:</span>
                  <span className="font-mono font-bold text-blue-300">{d.rainfall} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pressure:</span>
                  <span className="font-mono text-slate-300">{d.pressure} hPa</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Wind:</span>
                  <span className="font-mono text-slate-300">{d.wind_speed} m/s</span>
                </div>
              </div>

              {/* Weather Event Tag */}
              <div className="mb-3">
                <WeatherEventBadge event={d.weather_event} isInferred={d.is_inferred_event} />
              </div>
            </div>

            {/* AI Decision Support Layer (The Core Product) */}
            <div className="pt-3 border-t border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  Confidence:
                </span>
                <span className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded border ${getConfStyle(d.confidence_category)}`}>
                  {d.confidence_score}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  Bust Prob:
                </span>
                <span className={`text-xs font-mono font-bold ${d.bust_probability >= 0.5 ? 'text-rose-400' : d.bust_probability >= 0.25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {(d.bust_probability * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Expected Error:</span>
                <span className="text-xs font-mono font-semibold text-slate-200">
                  ±{d.expected_error}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
