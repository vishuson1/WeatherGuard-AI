from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Health & System Status
class HealthResponse(BaseModel):
    status: str
    mode: str # "LIVE" or "DEMO / RESEARCH MODE"
    database_status: str
    active_model: str
    last_data_update: Optional[str] = None
    next_update: Optional[str] = None
    data_health: str # "GOOD" or "DEGRADED"

class SystemStatusResponse(BaseModel):
    is_live: bool
    mode_label: str
    last_successful_update: Optional[str]
    next_scheduled_update: Optional[str]
    data_provider: str
    active_model_version: str
    total_observations_count: int
    total_forecasts_count: int
    data_health_status: str # "GOOD" or "DEGRADED"
    quality_issues: List[str] = []

# Weather & Forecast
class CurrentWeatherItem(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    timestamp: str
    temperature: float
    humidity: float
    pressure: float
    rainfall: float
    wind_speed: float
    wind_direction: float
    cloud_cover: float
    weather_condition: str
    source: str

class DayForecastItem(BaseModel):
    day: int
    date: str
    lead_time_hours: int
    temperature: float
    rainfall: float
    pressure: float
    wind_speed: float
    humidity: float
    expected_error: float
    bust_probability: float
    confidence_score: float
    confidence_category: str # "VERY HIGH", "HIGH", "MEDIUM", "LOW", "VERY LOW"
    weather_event: str
    is_inferred_event: bool = False

class ForecastResponse(BaseModel):
    region: str
    latitude: float
    longitude: float
    initialization_time: str
    days: List[DayForecastItem]
    model_version: str
    mode: str

# Confidence & Bust Risk
class RegionalRiskItem(BaseModel):
    region_id: str
    name: str
    latitude: float
    longitude: float
    forecast_day: int
    forecast_temp: float
    forecast_rainfall: float
    expected_error: float
    bust_probability: float
    confidence_score: float
    confidence_category: str
    risk_level: str # "HIGH_RISK", "MODERATE_RISK", "LOW_RISK"
    weather_event: str
    top_risk_factors: List[str] = []
    historical_mae: float

class RegionalRiskResponse(BaseModel):
    forecast_day: int
    high_risk_count: int
    regions: List[RegionalRiskItem]
    threshold_used: Dict[str, float]

class HistoricalErrorFilter(BaseModel):
    region: Optional[str] = None
    variable: str = "rainfall" # rainfall, temperature, wind_speed, pressure
    forecast_day: Optional[int] = None
    season: Optional[str] = None
    weather_event: Optional[str] = None

class HistoricalErrorStats(BaseModel):
    variable: str
    sample_count: int
    mae: float
    rmse: float
    bias: float
    bust_frequency: float # percentage e.g. 18.5%
    forecast_skill: float # skill score e.g. 0.72
    error_by_lead_time: List[Dict[str, Any]]
    error_distribution: List[Dict[str, Any]]
    bust_prob_by_lead_time: List[Dict[str, Any]]
    event_performance: List[Dict[str, Any]]

# Explainability
class FeatureImportanceItem(BaseModel):
    feature_name: str
    importance_value: float # SHAP value or contribution
    percentage: float
    direction: str # "increases_risk" or "reduces_risk"
    description: str

class ExplainRequest(BaseModel):
    region: str
    forecast_day: int = 5
    variable: str = "rainfall"
    lead_time_hours: Optional[int] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    wind_speed: Optional[float] = None
    rainfall: Optional[float] = None

class ExplainResponse(BaseModel):
    region: str
    forecast_day: int
    confidence_score: float
    confidence_category: str
    bust_probability: float
    expected_error: float
    label: str = "Model-derived contributing factors"
    features: List[FeatureImportanceItem]
    natural_language_explanation: str
    historical_context: Dict[str, Any]

# Prediction Request
class PredictRequest(BaseModel):
    latitude: float
    longitude: float
    forecast_day: int = 1
    lead_time_hours: int = 24
    temperature: float
    humidity: float
    pressure: float
    rainfall: float
    wind_speed: float
    wind_direction: float = 180.0
    season: Optional[str] = "monsoon"
    region: Optional[str] = "Odisha"

class PredictResponse(BaseModel):
    forecast_day: int
    expected_error: float
    bust_probability: float
    confidence_score: float
    confidence_category: str
    weather_event: str
    model_version: str
    contributing_factors: List[Dict[str, Any]]

# Model Training & Management
class TrainModelRequest(BaseModel):
    model_name: str = "WeatherGuard-Operational"
    regressor_type: str = "xgboost" # xgboost, lightgbm, random_forest
    classifier_type: str = "xgboost" # xgboost, lightgbm, random_forest, logistic_regression
    training_period: str = "2018-2023"
    validation_period: str = "2024"
    test_period: str = "2025"
    bust_threshold_temp: float = 3.0
    bust_threshold_rain: float = 20.0
    bust_threshold_wind: float = 7.0
    bust_threshold_pressure: float = 3.0

class ModelMetricsResponse(BaseModel):
    model_id: int
    model_name: str
    version: str
    training_date: str
    dataset: str
    regressor_metrics: Dict[str, Any] # MAE, RMSE, R2
    classifier_metrics: Dict[str, Any] # Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Brier
    confusion_matrix: Dict[str, Any]
    feature_importance: List[Dict[str, Any]]
    calibration_data: List[Dict[str, Any]]
    status: str

# Dataset Upload & Inspection
class DatasetInspectionResponse(BaseModel):
    id: int
    filename: str
    rows: int
    columns: int
    column_names: List[str]
    missing_values: Dict[str, int]
    duplicate_records: int
    numerical_features: List[str]
    categorical_features: List[str]
    date_range: Optional[str]
    geographical_coverage: Optional[str]
    suitability: Dict[str, bool] # {weather_prediction, forecast_error_prediction, forecast_bust_classification, historical_verification}
    forecast_observation_paired: bool
    validation_messages: List[str]
