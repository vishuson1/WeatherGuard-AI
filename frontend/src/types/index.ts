export interface HealthStatus {
  status: string;
  mode: string;
  database_status: string;
  active_model: string;
  last_data_update: string;
  next_update: string;
  data_health: string;
}

export interface SystemStatus {
  is_live: boolean;
  mode_label: string;
  last_successful_update: string | null;
  next_scheduled_update: string | null;
  data_provider: string;
  active_model_version: string;
  total_observations_count: number;
  total_forecasts_count: number;
  data_health_status: string;
  quality_issues: string[];
}

export interface SynopticRegion {
  id: string;
  name: string;
  lat: number;
  lon: number;
  coastal: boolean;
  hazard: string;
}

export interface CurrentWeatherItem {
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_speed: number;
  wind_direction: number;
  cloud_cover: number;
  weather_condition: string;
  source: string;
}

export interface DayForecastItem {
  day: number;
  date: string;
  lead_time_hours: number;
  temperature: number;
  rainfall: number;
  pressure: number;
  wind_speed: number;
  humidity: number;
  expected_error: number;
  bust_probability: number;
  confidence_score: number;
  confidence_category: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
  weather_event: string;
  is_inferred_event: boolean;
}

export interface ForecastResponse {
  region: string;
  latitude: number;
  longitude: number;
  initialization_time: string;
  days: DayForecastItem[];
  model_version: string;
  mode: string;
}

export interface RegionalRiskItem {
  region_id: string;
  name: string;
  latitude: number;
  longitude: number;
  forecast_day: number;
  forecast_temp: number;
  forecast_rainfall: number;
  expected_error: number;
  bust_probability: number;
  confidence_score: number;
  confidence_category: string;
  risk_level: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  weather_event: string;
  top_risk_factors: string[];
  historical_mae: number;
}

export interface RegionalRiskResponse {
  forecast_day: number;
  high_risk_count: number;
  regions: RegionalRiskItem[];
  threshold_used: Record<string, number>;
}

export interface FeatureImportanceItem {
  feature_name: string;
  importance_value: number;
  percentage: number;
  direction: string;
  description: string;
}

export interface ExplainResponse {
  region: string;
  forecast_day: number;
  confidence_score: number;
  confidence_category: string;
  bust_probability: number;
  expected_error: number;
  label: string;
  features: FeatureImportanceItem[];
  natural_language_explanation: string;
  historical_context: {
    similar_historical_situations: number;
    historical_mean_error: number;
    historical_bust_rate: string;
  };
}

export interface HistoricalErrorStats {
  variable: string;
  sample_count: number;
  mae: number;
  rmse: number;
  bias: number;
  bust_frequency: number;
  forecast_skill: number;
  error_by_lead_time: Array<{
    forecast_day: number;
    lead_time_hours: number;
    mae: number;
    rmse: number;
    bias: number;
    bust_probability: number;
    sample_count: number;
  }>;
  error_distribution: Array<{
    bin: string;
    count: number;
    percentage: number;
  }>;
  bust_prob_by_lead_time: Array<{
    forecast_day: number;
    bust_probability: number;
  }>;
  event_performance: Array<{
    event: string;
    mae: number;
    rmse: number;
    bust_frequency: number;
    sample_size: number;
    status: string;
  }>;
}

export interface ModelMetricsResponse {
  model_id: number;
  model_name: string;
  version: string;
  training_date: string;
  dataset: string;
  training_period: string;
  validation_period: string;
  test_period: string;
  regressor_type: string;
  classifier_type: string;
  regressor_metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  classifier_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
    brier_score: number;
  };
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  calibration_data: Array<{
    predicted_prob: number;
    true_frequency: number;
  }>;
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
  status: string;
}

export interface DatasetInspectionResponse {
  id: number;
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  missing_values: Record<string, number>;
  duplicate_records: number;
  numerical_features: string[];
  categorical_features: string[];
  date_range: string;
  geographical_coverage: string;
  suitability: {
    weather_prediction: boolean;
    forecast_error_prediction: boolean;
    forecast_bust_classification: boolean;
    historical_verification: boolean;
  };
  forecast_observation_paired: boolean;
  validation_messages: string[];
}
