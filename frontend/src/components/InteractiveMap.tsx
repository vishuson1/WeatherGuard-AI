import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, AlertTriangle, Shield, Wind, Droplets, Thermometer, Gauge, ChevronRight } from 'lucide-react';
import { RegionalRiskItem } from '../types';

interface Props {
  regions: RegionalRiskItem[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectRegion?: (region: RegionalRiskItem) => void;
}

type MapLayer = 'confidence' | 'bust' | 'error' | 'rainfall' | 'temp' | 'wind' | 'risk_zones';

export const InteractiveMap: React.FC<Props> = ({
  regions,
  selectedDay,
  onSelectDay,
  onSelectRegion
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayer>('confidence');
  const [clickedRegion, setClickedRegion] = useState<RegionalRiskItem | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on India synoptic domain
    const map = L.map(mapContainerRef.current, {
      center: [21.5, 82.0],
      zoom: 5,
      zoomControl: true,
      minZoom: 4,
      maxZoom: 9
    });

    // Dark cartographic tiles (Esri Dark Gray - high-contrast, free & keyless)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 16
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when regions, activeLayer, or selectedDay change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    regions.forEach((r) => {
      let color = '#38bdf8';
      let radius = 12;
      let labelValue = '';
      let isHighRisk = r.risk_level === 'HIGH_RISK';

      if (activeLayer === 'confidence') {
        labelValue = `${r.confidence_score}%`;
        if (r.confidence_score >= 80) color = '#10b981';
        else if (r.confidence_score >= 65) color = '#14b8a6';
        else if (r.confidence_score >= 45) color = '#f59e0b';
        else color = '#f43f5e';
      } else if (activeLayer === 'bust') {
        labelValue = `${(r.bust_probability * 100).toFixed(0)}%`;
        if (r.bust_probability >= 0.5) color = '#f43f5e';
        else if (r.bust_probability >= 0.25) color = '#f59e0b';
        else color = '#10b981';
      } else if (activeLayer === 'error') {
        labelValue = `±${r.expected_error}`;
        if (r.expected_error >= 8.0) color = '#f43f5e';
        else if (r.expected_error >= 4.0) color = '#f59e0b';
        else color = '#06b6d4';
      } else if (activeLayer === 'rainfall') {
        labelValue = `${r.forecast_rainfall}mm`;
        if (r.forecast_rainfall >= 50) color = '#3b82f6';
        else if (r.forecast_rainfall >= 15) color = '#06b6d4';
        else color = '#64748b';
      } else if (activeLayer === 'temp') {
        labelValue = `${r.forecast_temp}°C`;
        if (r.forecast_temp >= 40) color = '#ef4444';
        else if (r.forecast_temp >= 32) color = '#f97316';
        else color = '#38bdf8';
      } else if (activeLayer === 'risk_zones') {
        if (isHighRisk) {
          color = '#f43f5e';
          radius = 16;
          labelValue = 'HIGH RISK';
        } else {
          color = '#64748b';
          radius = 8;
          labelValue = 'OK';
        }
      }

      // Outer radar pulse ring for high risk regions
      if (isHighRisk) {
        const pulseCircle = L.circleMarker([r.latitude, r.longitude], {
          radius: 26,
          color: '#f43f5e',
          weight: 1,
          opacity: 0.6,
          fillColor: '#f43f5e',
          fillOpacity: 0.15,
          className: 'radar-pulse'
        });
        pulseCircle.addTo(markersLayerRef.current!);
      }

      // Inner custom HTML marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${color};
            color: #f8fafc;
            border-radius: 9999px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:9999px; background:${color};"></span>
            ${r.name.split(' ')[0]} ${labelValue}
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([r.latitude, r.longitude], { icon: customIcon });

      marker.on('click', () => {
        setClickedRegion(r);
        if (onSelectRegion) onSelectRegion(r);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [regions, activeLayer, selectedDay]);

  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Layer Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-lg p-1.5 backdrop-blur-md shadow-xl text-xs">
        <span className="text-slate-400 font-semibold px-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Layer:
        </span>
        <button
          onClick={() => setActiveLayer('confidence')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'confidence' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Confidence
        </button>
        <button
          onClick={() => setActiveLayer('bust')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'bust' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Bust Prob
        </button>
        <button
          onClick={() => setActiveLayer('error')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'error' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Expected Error
        </button>
        <button
          onClick={() => setActiveLayer('risk_zones')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'risk_zones' ? 'bg-purple-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Reliability Risk Areas
        </button>
        <button
          onClick={() => setActiveLayer('rainfall')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'rainfall' ? 'bg-blue-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Rainfall
        </button>
        <button
          onClick={() => setActiveLayer('temp')}
          className={`px-2.5 py-1 rounded font-medium transition-all ${
            activeLayer === 'temp' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Temp
        </button>
      </div>

      {/* Top Right Day Lead Time Quick Switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-slate-900/90 border border-slate-700/70 rounded-lg p-1.5 backdrop-blur-md shadow-xl text-xs">
        <span className="text-slate-400 font-semibold px-2">Lead Time:</span>
        {[1, 3, 5, 7, 10].map((d) => (
          <button
            key={d}
            onClick={() => onSelectDay(d)}
            className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
              selectedDay === d ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            D{d}
          </button>
        ))}
      </div>

      {/* Clicked Region Drilldown Floating Sidebar/Card */}
      {clickedRegion && (
        <div className="absolute bottom-4 right-4 z-[1000] w-84 bg-slate-900/95 border border-cyan-500/40 rounded-xl p-4 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                {clickedRegion.name}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Day {clickedRegion.forecast_day} (+{clickedRegion.forecast_day * 24}h Horizon)
              </span>
            </div>
            <button
              onClick={() => setClickedRegion(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</span>
              <div className="text-lg font-extrabold text-cyan-400 font-mono">
                {clickedRegion.confidence_score}%
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                {clickedRegion.confidence_category}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Bust Prob</span>
              <div className="text-lg font-extrabold text-rose-400 font-mono">
                {(clickedRegion.bust_probability * 100).toFixed(0)}%
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                {clickedRegion.risk_level === 'HIGH_RISK' ? 'CRITICAL' : 'MODERATE'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Expected Error</span>
              <div className="text-base font-extrabold text-slate-200 font-mono">
                ±{clickedRegion.expected_error}
              </div>
              <span className="text-[10px] text-slate-400">
                Hist MAE: {clickedRegion.historical_mae}
              </span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Forecast Weather</span>
              <div className="text-base font-extrabold text-slate-200 font-mono">
                {clickedRegion.forecast_temp}°C
              </div>
              <span className="text-[10px] text-cyan-300">
                Rain: {clickedRegion.forecast_rainfall} mm
              </span>
            </div>
          </div>

          {/* Top Risk Factors */}
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Top Model Contributing Factors:
            </span>
            <div className="space-y-1">
              {clickedRegion.top_risk_factors.map((factor, idx) => (
                <div key={idx} className="text-[11px] text-slate-300 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span className="truncate">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Weather Event:</span>
            <span className="font-semibold text-cyan-300">{clickedRegion.weather_event}</span>
          </div>
        </div>
      )}
    </div>
  );
};
