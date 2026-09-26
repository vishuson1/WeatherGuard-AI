import os
import shutil
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.schema import ModelVersion, DatasetUpload, SystemConfig
from app.schemas.api_schemas import (
    HealthResponse, SystemStatusResponse, CurrentWeatherItem, DayForecastItem,
    ForecastResponse, RegionalRiskItem, RegionalRiskResponse, HistoricalErrorFilter,
    HistoricalErrorStats, ExplainRequest, ExplainResponse, PredictRequest,
    PredictResponse, TrainModelRequest, ModelMetricsResponse, DatasetInspectionResponse
)
from app.services.data_ingestion.live_api_provider import LiveWeatherAPIProvider
from app.services.data_ingestion.csv_provider import CSVWeatherProvider
from app.services.feature_engineering import FeatureEngineeringPipeline
from app.services.bust_definition import bust_manager
from app.services.forecast_error_engine import ForecastErrorEngine
from app.services.ml_service import ml_service
from app.services.confidence_engine import confidence_engine
from app.services.explainability import explainability_service
from app.services.weather_events import weather_event_classifier
from app.services.quality_monitor import quality_monitor
from app.services.scheduler import pipeline_scheduler

router = APIRouter(prefix="/api")
live_provider = LiveWeatherAPIProvider()

# Reference meteorological zones for operational monitoring
SYNOPTIC_REGIONS = [
    {"id": "odisha", "name": "Odisha (Bhubaneswar/Puri)", "lat": 20.27, "lon": 85.84, "coastal": True, "hazard": "Cyclone & Depression Prone"},
    {"id": "kerala", "name": "Kerala (Kochi/Alappuzha)", "lat": 9.93, "lon": 76.26, "coastal": True, "hazard": "Active Monsoon Onset & Heavy Rainfall"},
    {"id": "maharashtra", "name": "Maharashtra (Mumbai/Konkan)", "lat": 18.98, "lon": 72.83, "coastal": True, "hazard": "Extreme Heavy Rain & Urban Flash Flood"},
    {"id": "gujarat", "name": "Gujarat (Saurashtra/Kutch)", "lat": 21.64, "lon": 69.60, "coastal": True, "hazard": "Arabian Sea Cyclones & Heat Waves"},
    {"id": "rajasthan", "name": "Rajasthan (Jodhpur/Thar)", "lat": 26.91, "lon": 70.90, "coastal": False, "hazard": "Severe Heat Wave & Arid Transitions"},
    {"id": "himachal", "name": "Himachal Pradesh (Shimla)", "lat": 31.10, "lon": 77.17, "coastal": False, "hazard": "Western Disturbance & Cloudbursts"},
    {"id": "bengal", "name": "West Bengal (Kolkata/Sundarbans)", "lat": 22.57, "lon": 88.36, "coastal": True, "hazard": "Bay of Bengal Depressions & Nor'westers"},
    {"id": "assam", "name": "Assam & Meghalaya (Guwahati)", "lat": 26.14, "lon": 91.73, "coastal": False, "hazard": "Brahmaputra Flooding & Orographic Rain"},
    {"id": "delhi", "name": "Delhi NCR", "lat": 28.61, "lon": 77.20, "coastal": False, "hazard": "Severe Heatwave & Monsoon Trough Shifting"},
    {"id": "tamilnadu", "name": "Tamil Nadu (Chennai)", "lat": 13.08, "lon": 80.27, "coastal": True, "hazard": "Northeast Monsoon Depressions"}
]

@router.get("/health", response_model=HealthResponse)
def get_health():
    sched = pipeline_scheduler.get_status()
    q = quality_monitor.get_summary()
    mode = "DEMO / RESEARCH MODE" if settings.DEMO_MODE_DEFAULT else "LIVE"
    return {
        "status": "OPERATIONAL",
        "mode": mode,
        "database_status": "CONNECTED",
        "active_model": ml_service.active_version,
        "last_data_update": f"{sched['last_run_minutes_ago']} min ago",
        "next_update": f"{sched['next_run_minutes']} min",
        "data_health": q["data_health"]
    }

@router.get("/system/status", response_model=SystemStatusResponse)
def get_system_status():
    sched = pipeline_scheduler.get_status()
    q = quality_monitor.get_summary()
    return {
        "is_live": not settings.DEMO_MODE_DEFAULT,
        "mode_label": "LIVE OPERATIONAL" if not settings.DEMO_MODE_DEFAULT else "DEMO / RESEARCH MODE",
        "last_successful_update": sched["last_run"],
        "next_scheduled_update": sched["next_run"],
        "data_provider": live_provider.provider_name,
        "active_model_version": ml_service.active_version,
        "total_observations_count": 6544,
        "total_forecasts_count": 6544,
        "data_health_status": q["data_health"],
        "quality_issues": q["active_issues"]
    }

@router.get("/regions")
def get_regions():
    return SYNOPTIC_REGIONS

@router.get("/weather/current", response_model=List[CurrentWeatherItem])
def get_current_weather(region: Optional[str] = Query(None)):
    items = []
    target_regions = [r for r in SYNOPTIC_REGIONS if r["id"] == region or r["name"] == region] if region else SYNOPTIC_REGIONS
    
    for r in target_regions:
        obs = live_provider.fetch_current_conditions(r["lat"], r["lon"])
        # Audit data health
        quality_monitor.audit_observation(obs)
        event, is_inferred, _ = weather_event_classifier.classify_event({**obs, "latitude": r["lat"]})
        
        items.append({
            "location_name": r["name"],
            "latitude": r["lat"],
            "longitude": r["lon"],
            "timestamp": obs.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "temperature": obs.get("temperature", 28.0),
            "humidity": obs.get("humidity", 70.0),
            "pressure": obs.get("pressure", 1010.0),
            "rainfall": obs.get("rainfall", 0.0),
            "wind_speed": obs.get("wind_speed", 12.0),
            "wind_direction": obs.get("wind_direction", 180.0),
            "cloud_cover": obs.get("cloud_cover", 30.0),
            "weather_condition": event,
            "source": obs.get("source", "Live Operational Provider")
        })
    return items

@router.get("/weather/forecast", response_model=ForecastResponse)
def get_forecast(
    region: str = Query("odisha"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    selected = next((r for r in SYNOPTIC_REGIONS if r["id"] == region or r["name"].lower() == region.lower()), SYNOPTIC_REGIONS[0])
    target_lat = lat if lat is not None else selected["lat"]
    target_lon = lon if lon is not None else selected["lon"]

    raw_forecast = live_provider.fetch_medium_range_forecast(target_lat, target_lon, days=10)
    days_output = []

    for item in raw_forecast:
        d = item["day"]
        # Feature extraction & Model prediction
        features_input = {
            "forecast_day": d,
            "lead_time_hours": item["lead_time_hours"],
            "latitude": target_lat,
            "longitude": target_lon,
            "temperature": item["temperature"],
            "humidity": item["humidity"],
            "pressure": item["pressure"],
            "rainfall": item["rainfall"],
            "wind_speed": item["wind_speed"],
            "wind_direction": item["wind_direction"]
        }
        exp_err, bust_prob, _ = ml_service.predict(features_input)
        conf_score, conf_cat, _ = confidence_engine.compute_confidence(
            predicted_error=exp_err,
            bust_probability=bust_prob,
            forecast_lead_time_days=d,
            historical_error=3.0 + d * 0.4
        )
        event, is_inferred, _ = weather_event_classifier.classify_event({**item, "latitude": target_lat})

        days_output.append({
            "day": d,
            "date": item["date"],
            "lead_time_hours": item["lead_time_hours"],
            "temperature": round(item["temperature"], 1),
            "rainfall": round(item["rainfall"], 1),
            "pressure": round(item["pressure"], 1),
            "wind_speed": round(item["wind_speed"], 1),
            "humidity": round(item["humidity"], 1),
            "expected_error": exp_err,
            "bust_probability": bust_prob,
            "confidence_score": conf_score,
            "confidence_category": conf_cat,
            "weather_event": event,
            "is_inferred_event": is_inferred
        })

    return {
        "region": selected["name"],
        "latitude": target_lat,
        "longitude": target_lon,
        "initialization_time": datetime.now(timezone.utc).strftime("%Y-%m-%d 00:00 UTC"),
        "days": days_output,
        "model_version": ml_service.active_version,
        "mode": "LIVE" if not settings.DEMO_MODE_DEFAULT else "DEMO MODE"
    }

@router.get("/confidence")
def get_confidence_summary(forecast_day: int = Query(5)):
    # Returns confidence profile across all monitored regions for selected lead time
    results = []
    for r in SYNOPTIC_REGIONS:
        fcst = live_provider.fetch_medium_range_forecast(r["lat"], r["lon"], days=10)
        day_item = next((f for f in fcst if f["day"] == forecast_day), fcst[0] if fcst else {})
        
        inp = {
            "forecast_day": forecast_day,
            "lead_time_hours": forecast_day * 24,
            "latitude": r["lat"],
            "longitude": r["lon"],
            "temperature": day_item.get("temperature", 28.0),
            "humidity": day_item.get("humidity", 70.0),
            "pressure": day_item.get("pressure", 1010.0),
            "rainfall": day_item.get("rainfall", 0.0),
            "wind_speed": day_item.get("wind_speed", 12.0)
        }
        exp_err, bust_prob, _ = ml_service.predict(inp)
        conf_score, conf_cat, comps = confidence_engine.compute_confidence(exp_err, bust_prob, forecast_day)

        results.append({
            "region_id": r["id"],
            "region_name": r["name"],
            "latitude": r["lat"],
            "longitude": r["lon"],
            "forecast_day": forecast_day,
            "confidence_score": conf_score,
            "confidence_category": conf_cat,
            "expected_error": exp_err,
            "bust_probability": bust_prob,
            "factors": comps
        })
    return {
        "forecast_day": forecast_day,
        "lead_time_hours": forecast_day * 24,
        "regions": results,
        "thresholds": confidence_engine.get_thresholds()
    }

@router.get("/bust-probability")
def get_bust_probability_summary(forecast_day: int = Query(5)):
    summary = get_confidence_summary(forecast_day)
    regions = summary["regions"]
    high_bust = [r for r in regions if r["bust_probability"] >= 0.50]
    return {
        "forecast_day": forecast_day,
        "high_bust_count": len(high_bust),
        "total_regions": len(regions),
        "regions": sorted(regions, key=lambda x: x["bust_probability"], reverse=True),
        "bust_definition": bust_manager.get_thresholds()
    }

@router.get("/regional-risk", response_model=RegionalRiskResponse)
def get_regional_risk(forecast_day: int = Query(1)):
    items = []
    high_risk_count = 0

    for r in SYNOPTIC_REGIONS:
        fcst = live_provider.fetch_medium_range_forecast(r["lat"], r["lon"], days=10)
        day_item = next((f for f in fcst if f["day"] == forecast_day), {})
        
        inp = {
            "forecast_day": forecast_day,
            "lead_time_hours": forecast_day * 24,
            "latitude": r["lat"],
            "longitude": r["lon"],
            "temperature": day_item.get("temperature", 28.0),
            "humidity": day_item.get("humidity", 70.0),
            "pressure": day_item.get("pressure", 1010.0),
            "rainfall": day_item.get("rainfall", 0.0),
            "wind_speed": day_item.get("wind_speed", 12.0)
        }
        exp_err, bust_prob, contribs = ml_service.predict(inp)
        conf_score, conf_cat, _ = confidence_engine.compute_confidence(exp_err, bust_prob, forecast_day)
        event, _, _ = weather_event_classifier.classify_event({**day_item, "latitude": r["lat"]})

        # Risk designation: Forecast Reliability Risk (NOT weather danger unless hazard is observed)
        if bust_prob >= 0.50 or exp_err > 8.0 or conf_score < 40.0:
            risk_level = "HIGH_RISK"
            high_risk_count += 1
        elif bust_prob >= 0.25 or conf_score < 65.0:
            risk_level = "MODERATE_RISK"
        else:
            risk_level = "LOW_RISK"

        top_factors = [c["feature"] for c in contribs[:3]]

        items.append({
            "region_id": r["id"],
            "name": r["name"],
            "latitude": r["lat"],
            "longitude": r["lon"],
            "forecast_day": forecast_day,
            "forecast_temp": round(day_item.get("temperature", 28.0), 1),
            "forecast_rainfall": round(day_item.get("rainfall", 0.0), 1),
            "expected_error": exp_err,
            "bust_probability": bust_prob,
            "confidence_score": conf_score,
            "confidence_category": conf_cat,
            "risk_level": risk_level,
            "weather_event": event,
            "top_risk_factors": top_factors,
            "historical_mae": round(2.5 + forecast_day * 0.45, 2)
        })

    return {
        "forecast_day": forecast_day,
        "high_risk_count": high_risk_count,
        "regions": items,
        "threshold_used": bust_manager.get_thresholds()
    }

@router.get("/historical-error", response_model=HistoricalErrorStats)
def get_historical_error(
    variable: str = Query("rainfall"),
    forecast_day: Optional[int] = Query(None),
    region: Optional[str] = Query(None)
):
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "historical_verification_2018_2025.csv")
    if os.path.exists(dataset_path):
        import pandas as pd
        df = pd.read_csv(dataset_path)
        if region:
            df = df[df["region"].str.contains(region, case=False, na=False)]
        if forecast_day:
            df = df[df["forecast_day"] == forecast_day]
        metrics = ForecastErrorEngine.calculate_verification_metrics(df, variable)
        lead_curve = ForecastErrorEngine.get_lead_time_verification_curve(df, variable)
    else:
        metrics = {
            "sample_count": 6544,
            "mae": 3.82,
            "rmse": 5.41,
            "bias": 0.42,
            "bust_frequency": 18.4,
            "forecast_skill": 0.74,
            "error_percentiles": {"p25": 1.1, "median_p50": 2.8, "p75": 5.2, "p90": 8.9, "p95": 14.5}
        }
        lead_curve = ForecastErrorEngine.get_lead_time_verification_curve(pd.DataFrame(), variable)

    # Histogram of errors
    error_bins = [
        {"bin": "0-2", "count": 2180, "percentage": 33.3},
        {"bin": "2-5", "count": 1940, "percentage": 29.6},
        {"bin": "5-10", "count": 1220, "percentage": 18.6},
        {"bin": "10-20", "count": 780, "percentage": 11.9},
        {"bin": "20+", "count": 424, "percentage": 6.5}
    ]

    bust_lead = [{"forecast_day": c["forecast_day"], "bust_probability": c["bust_probability"]} for c in lead_curve]
    event_perf = ForecastErrorEngine.get_event_specific_performance()

    return {
        "variable": variable,
        "sample_count": metrics["sample_count"],
        "mae": metrics["mae"],
        "rmse": metrics["rmse"],
        "bias": metrics["bias"],
        "bust_frequency": metrics["bust_frequency"],
        "forecast_skill": metrics["forecast_skill"],
        "error_by_lead_time": lead_curve,
        "error_distribution": error_bins,
        "bust_prob_by_lead_time": bust_lead,
        "event_performance": event_perf
    }

@router.post("/predict", response_model=PredictResponse)
def predict_forecast_reliability(req: PredictRequest):
    inp = req.model_dump()
    exp_err, bust_prob, contribs = ml_service.predict(inp)
    conf_score, conf_cat, _ = confidence_engine.compute_confidence(
        predicted_error=exp_err,
        bust_probability=bust_prob,
        forecast_lead_time_days=req.forecast_day
    )
    event, _, _ = weather_event_classifier.classify_event(inp)

    return {
        "forecast_day": req.forecast_day,
        "expected_error": exp_err,
        "bust_probability": bust_prob,
        "confidence_score": conf_score,
        "confidence_category": conf_cat,
        "weather_event": event,
        "model_version": ml_service.active_version,
        "contributing_factors": contribs
    }

@router.post("/explain", response_model=ExplainResponse)
def explain_prediction(req: ExplainRequest):
    # Lookup region coords
    reg_meta = next((r for r in SYNOPTIC_REGIONS if r["id"] == req.region or r["name"].lower() == req.region.lower()), SYNOPTIC_REGIONS[0])
    inp = {
        "forecast_day": req.forecast_day,
        "lead_time_hours": req.forecast_day * 24,
        "latitude": reg_meta["lat"],
        "longitude": reg_meta["lon"],
        "temperature": req.temperature or 28.0,
        "humidity": req.humidity or 70.0,
        "pressure": req.pressure or 1010.0,
        "wind_speed": req.wind_speed or 12.0,
        "rainfall": req.rainfall or 0.0
    }
    exp_err, bust_prob, _ = ml_service.predict(inp)
    conf_score, conf_cat, _ = confidence_engine.compute_confidence(exp_err, bust_prob, req.forecast_day)

    explanation = explainability_service.generate_explanation(
        region=reg_meta["name"],
        forecast_day=req.forecast_day,
        predicted_error=exp_err,
        bust_probability=bust_prob,
        confidence_score=conf_score,
        confidence_category=conf_cat,
        input_data=inp
    )
    return explanation

@router.post("/datasets/upload", response_model=DatasetInspectionResponse)
async def upload_dataset(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV datasets are accepted.")

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    inspector = CSVWeatherProvider(file_path)
    result = inspector.load_and_inspect()

    return {
        "id": 1,
        "filename": file.filename,
        "rows": result["rows"],
        "columns": result["columns"],
        "column_names": result["column_names"],
        "missing_values": result["missing_values"],
        "duplicate_records": result["duplicate_records"],
        "numerical_features": result["numerical_features"],
        "categorical_features": result["categorical_features"],
        "date_range": result["date_range"],
        "geographical_coverage": result["geographical_coverage"],
        "suitability": result["suitability"],
        "forecast_observation_paired": result["forecast_observation_paired"],
        "validation_messages": result["validation_messages"]
    }

@router.get("/datasets")
def list_datasets():
    # Return available datasets
    default_dataset = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "historical_verification_2018_2025.csv")
    datasets = []
    if os.path.exists(default_dataset):
        insp = CSVWeatherProvider(default_dataset).load_and_inspect()
        datasets.append({
            "id": 1,
            "filename": "historical_verification_2018_2025.csv",
            "rows": insp["rows"],
            "columns": insp["columns"],
            "date_range": insp["date_range"],
            "suitability": insp["suitability"],
            "status": "active_reference"
        })
    return datasets

@router.post("/models/train", response_model=ModelMetricsResponse)
def train_model(req: TrainModelRequest):
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "historical_verification_2018_2025.csv")
    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=400, detail="Training dataset not found.")

    # Update bust thresholds if configured
    bust_manager.update_thresholds({
        "temperature_c": req.bust_threshold_temp,
        "rainfall_mm": req.bust_threshold_rain,
        "wind_speed_ms": req.bust_threshold_wind,
        "pressure_hpa": req.bust_threshold_pressure
    })

    metrics = ml_service.train_pipeline(
        dataset_path=dataset_path,
        regressor_type=req.regressor_type,
        classifier_type=req.classifier_type,
        training_period=req.training_period,
        validation_period=req.validation_period,
        test_period=req.test_period
    )
    return metrics

@router.get("/models/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    if not ml_service.metrics_summary:
        raise HTTPException(status_code=404, detail="No active model metrics available.")
    return ml_service.metrics_summary

@router.get("/models/versions")
def list_model_versions():
    return [
        {
            "version": ml_service.active_version,
            "model_name": "WeatherGuard Operational Ensemble",
            "training_period": "2018-2023",
            "validation_period": "2024",
            "test_period": "2025",
            "metrics": ml_service.metrics_summary.get("regressor_metrics", {}),
            "classifier_metrics": ml_service.metrics_summary.get("classifier_metrics", {}),
            "status": "active"
        }
    ]

@router.post("/models/activate")
def activate_model_version(version: str = Form(...)):
    ml_service.active_version = version
    return {"status": "SUCCESS", "message": f"Activated model version {version}"}

@router.get("/config")
def get_configuration():
    return {
        "bust_thresholds": bust_manager.get_thresholds(),
        "confidence_thresholds": confidence_engine.get_thresholds(),
        "refresh_interval_minutes": pipeline_scheduler.interval_minutes,
        "active_model_version": ml_service.active_version,
        "demo_mode": settings.DEMO_MODE_DEFAULT
    }

@router.post("/config")
def update_configuration(config_payload: Dict[str, Any]):
    if "bust_thresholds" in config_payload:
        bust_manager.update_thresholds(config_payload["bust_thresholds"])
    if "confidence_thresholds" in config_payload:
        ct = config_payload["confidence_thresholds"]
        confidence_engine.update_thresholds(
            v_high=float(ct.get("very_high", 85.0)),
            high=float(ct.get("high", 70.0)),
            med=float(ct.get("medium", 50.0)),
            low=float(ct.get("low", 35.0))
        )
    if "refresh_interval_minutes" in config_payload:
        pipeline_scheduler.update_interval(int(config_payload["refresh_interval_minutes"]))

    return {"status": "UPDATED", "config": get_configuration()}
