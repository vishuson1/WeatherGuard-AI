import {
  HealthStatus, SystemStatus, SynopticRegion, CurrentWeatherItem,
  ForecastResponse, RegionalRiskResponse, HistoricalErrorStats,
  ExplainResponse, ModelMetricsResponse, DatasetInspectionResponse
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMessage = errData.detail;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchJson<HealthStatus>('/health'),
  getSystemStatus: () => fetchJson<SystemStatus>('/system/status'),
  getRegions: () => fetchJson<SynopticRegion[]>('/regions'),
  getCurrentWeather: (region?: string) =>
    fetchJson<CurrentWeatherItem[]>(region ? `/weather/current?region=${region}` : '/weather/current'),
  getForecast: (region: string = 'odisha') =>
    fetchJson<ForecastResponse>(`/weather/forecast?region=${region}`),
  getRegionalRisk: (forecastDay: number = 1) =>
    fetchJson<RegionalRiskResponse>(`/regional-risk?forecast_day=${forecastDay}`),
  getConfidence: (forecastDay: number = 5) =>
    fetchJson<{ forecast_day: number; regions: any[]; thresholds: any }>(`/confidence?forecast_day=${forecastDay}`),
  getBustProbability: (forecastDay: number = 5) =>
    fetchJson<{ forecast_day: number; high_bust_count: number; regions: any[]; bust_definition: any }>(`/bust-probability?forecast_day=${forecastDay}`),
  getHistoricalError: (variable: string = 'rainfall', forecastDay?: number, region?: string) => {
    let query = `?variable=${variable}`;
    if (forecastDay) query += `&forecast_day=${forecastDay}`;
    if (region) query += `&region=${encodeURIComponent(region)}`;
    return fetchJson<HistoricalErrorStats>(`/historical-error${query}`);
  },
  explainPrediction: (payload: {
    region: string;
    forecast_day: number;
    variable?: string;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    rainfall?: number;
    wind_speed?: number;
  }) => fetchJson<ExplainResponse>('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getModelMetrics: () => fetchJson<ModelMetricsResponse>('/models/metrics'),
  getModelVersions: () => fetchJson<any[]>('/models/versions'),
  trainModel: (payload: any) => fetchJson<ModelMetricsResponse>('/models/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  uploadDataset: async (file: File): Promise<DatasetInspectionResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  getDatasets: () => fetchJson<any[]>('/datasets'),
  getConfig: () => fetchJson<any>('/config'),
  updateConfig: (payload: any) => fetchJson<any>('/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
