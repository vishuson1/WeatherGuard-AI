import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "data_health" in data
    assert "active_model" in data

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_live" in data
    assert "data_health_status" in data
    assert "data_provider" in data

def test_regions_endpoint():
    response = client.get("/api/regions")
    assert response.status_code == 200
    regions = response.json()
    assert len(regions) >= 8
    assert any(r["id"] == "odisha" for r in regions)

def test_current_weather():
    response = client.get("/api/weather/current")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    assert "temperature" in items[0]
    assert "pressure" in items[0]

def test_medium_range_forecast_10_days():
    response = client.get("/api/weather/forecast?region=odisha")
    assert response.status_code == 200
    data = response.json()
    assert data["region"] != ""
    assert len(data["days"]) == 10
    # Day 1 to 10 presence
    for i, d in enumerate(data["days"]):
        assert d["day"] == i + 1
        assert "expected_error" in d
        assert "bust_probability" in d
        assert "confidence_score" in d
        assert d["confidence_category"] in ["VERY HIGH", "HIGH", "MEDIUM", "LOW", "VERY LOW"]

def test_regional_risk():
    response = client.get("/api/regional-risk?forecast_day=5")
    assert response.status_code == 200
    data = response.json()
    assert data["forecast_day"] == 5
    assert len(data["regions"]) > 0
    assert "risk_level" in data["regions"][0]

def test_predict_endpoint():
    payload = {
        "latitude": 20.27,
        "longitude": 85.84,
        "forecast_day": 5,
        "lead_time_hours": 120,
        "temperature": 29.5,
        "humidity": 82.0,
        "pressure": 1002.0,
        "rainfall": 35.0,
        "wind_speed": 18.0,
        "wind_direction": 200.0,
        "region": "Odisha"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "expected_error" in res
    assert "bust_probability" in res
    assert "confidence_score" in res
    assert "weather_event" in res

def test_explain_endpoint():
    payload = {
        "region": "odisha",
        "forecast_day": 5,
        "variable": "rainfall",
        "temperature": 30.0,
        "humidity": 85.0,
        "pressure": 998.0,
        "rainfall": 45.0,
        "wind_speed": 22.0
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "Model-derived contributing factors"
    assert len(data["features"]) >= 4
    assert "natural_language_explanation" in data

def test_config_endpoint():
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert "bust_thresholds" in data
    assert "confidence_thresholds" in data
