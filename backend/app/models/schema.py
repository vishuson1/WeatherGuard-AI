from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Text, ForeignKey, JSON, Boolean
)
from sqlalchemy.orm import relationship

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="operator")  # admin, meteorologist, operator
    created_at = Column(DateTime, default=datetime.utcnow)

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    temperature = Column(Float, nullable=True)     # °C
    humidity = Column(Float, nullable=True)        # %
    pressure = Column(Float, nullable=True)        # hPa
    rainfall = Column(Float, nullable=True)        # mm
    wind_speed = Column(Float, nullable=True)      # m/s
    wind_direction = Column(Float, nullable=True)  # degrees
    cloud_cover = Column(Float, nullable=True)     # %
    source = Column(String(100), default="station") # station, api, reanalysis, satellite

class ForecastData(Base):
    __tablename__ = "forecast_data"

    id = Column(Integer, primary_key=True, index=True)
    initialization_time = Column(DateTime, nullable=False)
    forecast_time = Column(DateTime, index=True, nullable=False)
    lead_time_hours = Column(Integer, nullable=False) # e.g. 24, 48, ... 240
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    rainfall = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    source = Column(String(100), default="nwp_operational")

class ForecastError(Base):
    __tablename__ = "forecast_errors"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecast_data.id"), nullable=True)
    observation_id = Column(Integer, ForeignKey("weather_observations.id"), nullable=True)
    variable = Column(String(50), nullable=False) # temperature, rainfall, wind_speed, pressure
    forecast_value = Column(Float, nullable=False)
    observed_value = Column(Float, nullable=False)
    absolute_error = Column(Float, nullable=False)
    relative_error = Column(Float, nullable=True)
    bias = Column(Float, nullable=False)
    is_bust = Column(Boolean, default=False)
    lead_time_days = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    region = Column(String(100), nullable=True)
    forecast_day = Column(Integer, nullable=False) # 1 to 10
    expected_error = Column(Float, nullable=False)
    bust_probability = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False) # 0 to 100
    confidence_category = Column(String(50), nullable=False) # VERY HIGH, HIGH, MEDIUM, LOW, VERY LOW
    model_version = Column(String(50), nullable=False)
    contributing_factors = Column(JSON, nullable=True) # SHAP feature importance output

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False) # e.g. "WeatherGuard-GBM-V1"
    version = Column(String(50), unique=True, nullable=False)
    training_dataset = Column(String(255), nullable=False)
    feature_version = Column(String(50), default="v1.0")
    training_period = Column(String(100), default="2018-2023")
    validation_period = Column(String(100), default="2024")
    test_period = Column(String(100), default="2025")
    training_date = Column(DateTime, default=datetime.utcnow)
    bust_thresholds = Column(JSON, nullable=True) # thresholds used for bust definition
    metrics = Column(JSON, nullable=True) # MAE, RMSE, R2, Accuracy, ROC-AUC, etc.
    status = Column(String(50), default="active") # active, candidate, archived

class SystemConfig(Base):
    __tablename__ = "system_configurations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    rows_count = Column(Integer, default=0)
    columns_count = Column(Integer, default=0)
    date_range = Column(String(100), nullable=True)
    geo_coverage = Column(String(255), nullable=True)
    suitability = Column(JSON, nullable=True)
    summary = Column(JSON, nullable=True)
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)
