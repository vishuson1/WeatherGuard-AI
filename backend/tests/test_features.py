import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from app.services.feature_engineering import FeatureEngineeringPipeline
from app.services.bust_definition import bust_manager
from app.services.forecast_error_engine import ForecastErrorEngine
from app.services.confidence_engine import confidence_engine

def test_feature_engineering_pipeline():
    pipeline = FeatureEngineeringPipeline()
    sample_input = {
        "temperature": 32.0,
        "humidity": 75.0,
        "pressure": 1008.0,
        "rainfall": 15.0,
        "wind_speed": 14.0,
        "wind_direction": 180.0,
        "forecast_day": 3,
        "latitude": 20.27,
        "longitude": 85.84
    }
    features = pipeline.extract_features_single(sample_input)
    
    # Check all feature columns exist and are finite numbers
    for col in pipeline.FEATURE_COLUMNS:
        assert col in features
        assert isinstance(features[col], (int, float))
        assert not (features[col] != features[col]) # check not NaN

    # Check dew point logic
    assert features["dew_point"] <= features["temperature"]

    # Check wind components
    assert features["u_wind"] is not None
    assert features["v_wind"] is not None

def test_bust_definition_thresholds():
    # Temperature bust test (> 3.0°C)
    is_bust, err, _ = bust_manager.evaluate_bust("temperature", 35.0, 31.0)
    assert is_bust == 1
    assert err == 4.0

    is_bust_ok, err_ok, _ = bust_manager.evaluate_bust("temperature", 32.0, 31.0)
    assert is_bust_ok == 0
    assert err_ok == 1.0

    # Rainfall bust test (> 20mm)
    is_rain_bust, r_err, _ = bust_manager.evaluate_bust("rainfall", 45.0, 10.0)
    assert is_rain_bust == 1
    assert r_err == 35.0

def test_forecast_confidence_engine():
    # Day 1 with low error and low bust probability -> VERY HIGH confidence
    score_day1, cat_day1, _ = confidence_engine.compute_confidence(
        predicted_error=1.2,
        bust_probability=0.05,
        forecast_lead_time_days=1
    )
    assert score_day1 >= 80.0
    assert cat_day1 in ["VERY HIGH", "HIGH"]

    # Day 9 with high error and high bust probability -> LOW or VERY LOW confidence
    score_day9, cat_day9, _ = confidence_engine.compute_confidence(
        predicted_error=18.5,
        bust_probability=0.72,
        forecast_lead_time_days=9
    )
    assert score_day9 < 50.0
    assert cat_day9 in ["LOW", "VERY LOW"]
