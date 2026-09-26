from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

class WeatherDataProvider(ABC):
    """
    Abstract interface for meteorological data ingestion.
    Allows hot-swapping between CSV/Kaggle, Open-Meteo, OpenWeatherMap,
    NWP providers (ECMWF/GFS/IMD), and observational station networks.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the data provider implementation."""
        pass

    @property
    @abstractmethod
    def is_operational(self) -> bool:
        """Whether the provider is currently active and reachable."""
        pass

    @abstractmethod
    def fetch_current_conditions(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch instantaneous observed atmospheric state.
        Returns dict with: temperature, humidity, pressure, rainfall, wind_speed, wind_direction, cloud_cover, timestamp, source
        """
        pass

    @abstractmethod
    def fetch_medium_range_forecast(self, latitude: float, longitude: float, days: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch Day 1 to Day N NWP/operational model forecast.
        Returns list of daily dicts with: day, lead_time_hours, forecast_time, temperature, humidity, pressure, rainfall, wind_speed, wind_direction
        """
        pass

    @abstractmethod
    def fetch_historical_observations(self, latitude: float, longitude: float, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Fetch historical verified observation data for error calculations.
        """
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """
        Verify provider connectivity, latency, and status.
        """
        pass
