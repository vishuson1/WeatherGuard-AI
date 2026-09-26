import os
from pydantic import BaseModel
from typing import Optional

class Settings(BaseModel):
    PROJECT_NAME: str = "WeatherGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./weatherguard.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "weatherguard-super-secret-production-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # External APIs
    WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY", None)
    NWP_API_URL: Optional[str] = os.getenv("NWP_API_URL", None)
    NWP_API_KEY: Optional[str] = os.getenv("NWP_API_KEY", None)
    
    # Operational configuration
    DATA_REFRESH_INTERVAL_MINUTES: int = int(os.getenv("DATA_REFRESH_INTERVAL_MINUTES", "15"))
    DEMO_MODE_DEFAULT: bool = os.getenv("DEMO_MODE", "false").lower() == "true"
    
    # Default Configurable Bust Thresholds
    DEFAULT_BUST_THRESHOLD_TEMP_C: float = 3.0       # > 3.0°C error
    DEFAULT_BUST_THRESHOLD_RAIN_MM: float = 20.0     # > 20 mm/day error
    DEFAULT_BUST_THRESHOLD_WIND_MS: float = 7.0      # > 7.0 m/s error
    DEFAULT_BUST_THRESHOLD_PRESSURE_HPA: float = 3.0 # > 3.0 hPa error
    
    # Confidence Score Category Thresholds (0-100)
    CONFIDENCE_VERY_HIGH: float = 85.0
    CONFIDENCE_HIGH: float = 70.0
    CONFIDENCE_MEDIUM: float = 50.0
    CONFIDENCE_LOW: float = 35.0

settings = Settings()
