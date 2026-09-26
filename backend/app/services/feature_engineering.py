import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

class FeatureEngineeringPipeline:
    """
    Modular meteorological feature engineering pipeline.
    Constructs surface, atmospheric, temporal, spatial, and historical error behavior features.
    """

    FEATURE_COLUMNS = [
        # Surface
        "temperature", "humidity", "pressure", "rainfall",
        "wind_speed", "wind_direction", "cloud_cover", "dew_point", "visibility",
        # Atmospheric
        "sea_level_pressure", "geopotential_height", "t_850hpa",
        "z_500hpa", "rh_700hpa", "u_wind", "v_wind", "vertical_velocity",
        # Temporal
        "hour", "day", "month", "season_code", "forecast_day", "lead_time_hours",
        # Spatial
        "latitude", "longitude", "distance_to_coast",
        # Historical & Error Dynamics
        "historical_mae", "historical_rmse", "historical_bias",
        "historical_bust_frequency", "recent_forecast_error",
        "regional_error", "lead_time_error"
    ]

    @staticmethod
    def calculate_dew_point(temp_c: float, rh_pct: float) -> float:
        """Magnus-Tetens formula approximation for dew point temperature."""
        a = 17.27
        b = 237.7
        rh = max(0.01, min(100.0, rh_pct))
        alpha = ((a * temp_c) / (b + temp_c)) + math.log(rh / 100.0)
        return (b * alpha) / (a - alpha)

    @staticmethod
    def calculate_wind_components(wind_speed: float, wind_dir_deg: float) -> tuple[float, float]:
        """Convert wind speed and meteorological direction to zonal (u) and meridional (v) components."""
        rad = math.radians(wind_dir_deg)
        u = -wind_speed * math.sin(rad)
        v = -wind_speed * math.cos(rad)
        return round(u, 2), round(v, 2)

    @staticmethod
    def get_season_code(month: int) -> int:
        """
        Season encoding:
        1 = Winter (Jan, Feb)
        2 = Pre-Monsoon / Summer (Mar, Apr, May)
        3 = Monsoon (Jun, Jul, Aug, Sep)
        4 = Post-Monsoon (Oct, Nov, Dec)
        """
        if month in [1, 2]:
            return 1
        elif month in [3, 4, 5]:
            return 2
        elif month in [6, 7, 8, 9]:
            return 3
        else:
            return 4

    @staticmethod
    def approximate_distance_to_coast(lat: float, lon: float) -> float:
        """
        Calculates approximate distance to nearest major coastline (km) for synoptic maritime vs continental air mass.
        """
        # Benchmark coastal anchor points for Indian subcontinent & surrounding oceans
        coastal_anchors = [
            (19.8, 85.8),  # Odisha Puri
            (17.7, 83.3),  # Visakhapatnam
            (13.1, 80.3),  # Chennai
            (8.5, 76.9),   # Thiruvananthapuram
            (15.4, 73.8),  # Goa
            (19.0, 72.8),  # Mumbai
            (21.6, 69.6),  # Gujarat Porbandar
            (21.7, 87.8),  # West Bengal Digha
        ]
        min_dist = float("inf")
        for c_lat, c_lon in coastal_anchors:
            # Haversine distance in km
            dlat = math.radians(c_lat - lat)
            dlon = math.radians(c_lon - lon)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(c_lat)) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist = 6371.0 * c
            if dist < min_dist:
                min_dist = dist
        return round(min_dist, 1)

    def extract_features_single(self, data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract complete normalized feature vector for a single forecast instance.
        """
        temp = float(data.get("temperature", 28.0))
        rh = float(data.get("humidity", 70.0))
        p_sfc = float(data.get("pressure", 1010.0))
        rain = float(data.get("rainfall", 0.0))
        w_spd = float(data.get("wind_speed", 12.0))
        w_dir = float(data.get("wind_direction", 180.0))
        c_cov = float(data.get("cloud_cover", 40.0))

        # Atmospheric derivations
        dew_pt = self.calculate_dew_point(temp, rh)
        vis = float(data.get("visibility", max(2.0, 10.0 - (rain * 0.3) - (rh > 90) * 3.0)))
        u, v = self.calculate_wind_components(w_spd, w_dir)
        
        slp = float(data.get("sea_level_pressure", p_sfc + 2.0))
        geo_h = float(data.get("geopotential_height", 120.0))
        t_850 = float(data.get("850hPa_temperature", data.get("t_850hpa", temp - 6.5)))
        z_500 = float(data.get("500hPa_geopotential", data.get("z_500hpa", 5840.0)))
        rh_700 = float(data.get("700hPa_humidity", data.get("rh_700hpa", min(100.0, rh * 0.85))))
        w_vert = float(data.get("vertical_velocity", -0.15 if rain > 5 else 0.02))

        # Temporal
        now = datetime.utcnow()
        hour = int(data.get("hour", now.hour))
        day = int(data.get("day", now.day))
        month = int(data.get("month", now.month))
        season_code = self.get_season_code(month)
        fcst_day = int(data.get("forecast_day", 1))
        lead_hours = int(data.get("lead_time_hours", fcst_day * 24))

        # Spatial
        lat = float(data.get("latitude", 20.0))
        lon = float(data.get("longitude", 85.0))
        dist_coast = self.approximate_distance_to_coast(lat, lon)

        # Historical forecast error behaviors
        # As lead time increases, historical uncertainty grows non-linearly
        lead_factor = 1.0 + (fcst_day - 1) * 0.28
        hist_mae = float(data.get("historical_mae", round(2.8 * lead_factor, 2)))
        hist_rmse = float(data.get("historical_rmse", round(4.1 * lead_factor, 2)))
        hist_bias = float(data.get("historical_bias", round(0.4 * (1 if temp > 30 else -1), 2)))
        hist_bust_freq = float(data.get("historical_bust_frequency", round(min(0.75, 0.08 * (fcst_day ** 1.1)), 3)))
        recent_err = float(data.get("recent_forecast_error", round(hist_mae * 0.95, 2)))
        reg_err = float(data.get("regional_error", round(hist_mae * 1.05, 2)))
        lead_err = float(data.get("lead_time_error", round(hist_rmse * 1.1, 2)))

        return {
            "temperature": temp,
            "humidity": rh,
            "pressure": p_sfc,
            "rainfall": rain,
            "wind_speed": w_spd,
            "wind_direction": w_dir,
            "cloud_cover": c_cov,
            "dew_point": dew_pt,
            "visibility": vis,
            "sea_level_pressure": slp,
            "geopotential_height": geo_h,
            "t_850hpa": t_850,
            "z_500hpa": z_500,
            "rh_700hpa": rh_700,
            "u_wind": u,
            "v_wind": v,
            "vertical_velocity": w_vert,
            "hour": float(hour),
            "day": float(day),
            "month": float(month),
            "season_code": float(season_code),
            "forecast_day": float(fcst_day),
            "lead_time_hours": float(lead_hours),
            "latitude": lat,
            "longitude": lon,
            "distance_to_coast": dist_coast,
            "historical_mae": hist_mae,
            "historical_rmse": hist_rmse,
            "historical_bias": hist_bias,
            "historical_bust_frequency": hist_bust_freq,
            "recent_forecast_error": recent_err,
            "regional_error": reg_err,
            "lead_time_error": lead_err
        }

    def transform_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform a full dataframe of forecast instances into engineered ML features.
        """
        features_list = []
        for _, row in df.iterrows():
            features_list.append(self.extract_features_single(row.to_dict()))
        return pd.DataFrame(features_list)
