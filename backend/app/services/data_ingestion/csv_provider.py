import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("weatherguard.csv_provider")

class CSVWeatherProvider:
    """
    Parser, inspector, and validator for Kaggle and historical weather CSV datasets.
    Validates suitability across:
      A. Weather prediction
      B. Forecast-error prediction
      C. Forecast-bust classification
      D. Historical verification
    """

    def __init__(self, file_path: str):
        self.file_path = file_path
        self._df: Optional[pd.DataFrame] = None

    def load_and_inspect(self) -> Dict[str, Any]:
        """
        Load dataset and perform automated structural, quality, and meteorological inspection.
        """
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Dataset file not found: {self.file_path}")

        try:
            df = pd.read_csv(self.file_path)
            self._df = df
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {e}")

        rows, cols = df.shape
        col_names = list(df.columns)
        
        # Missing values & duplicates
        missing_vals = {col: int(df[col].isna().sum()) for col in col_names if df[col].isna().sum() > 0}
        dup_count = int(df.duplicated().sum())

        # Feature separation
        num_cols = list(df.select_dtypes(include=[np.number]).columns)
        cat_cols = list(df.select_dtypes(include=['object', 'category', 'string']).columns)

        # Date column detection
        date_cols = [c for c in col_names if any(k in c.lower() for k in ['date', 'time', 'timestamp', 'init_time', 'forecast_time'])]
        date_range_str = "None detected"
        if date_cols:
            try:
                date_parsed = pd.to_datetime(df[date_cols[0]], errors='coerce')
                valid_dates = date_parsed.dropna()
                if not valid_dates.empty:
                    date_range_str = f"{valid_dates.min().strftime('%Y-%m-%d')} to {valid_dates.max().strftime('%Y-%m-%d')}"
            except Exception:
                pass

        # Geographical coverage
        lat_cols = [c for c in col_names if 'lat' in c.lower()]
        lon_cols = [c for c in col_names if 'lon' in c.lower()]
        geo_str = "Global / Unspecified"
        if lat_cols and lon_cols:
            min_lat, max_lat = df[lat_cols[0]].min(), df[lat_cols[0]].max()
            min_lon, max_lon = df[lon_cols[0]].min(), df[lon_cols[0]].max()
            geo_str = f"Lat: [{min_lat:.2f}, {max_lat:.2f}], Lon: [{min_lon:.2f}, {max_lon:.2f}]"

        # Check for forecast variables and observation variables
        forecast_vars = [c for c in col_names if any(k in c.lower() for k in ['forecast', 'pred', 'nwp', 'fcst', 'model_'])]
        obs_vars = [c for c in col_names if any(k in c.lower() for k in ['obs', 'actual', 'truth', 'target', 'ground'])]
        lead_time_vars = [c for c in col_names if any(k in c.lower() for k in ['lead', 'day', 'hour', 'step'])]
        error_vars = [c for c in col_names if any(k in c.lower() for k in ['error', 'mae', 'rmse', 'diff', 'residual'])]
        bust_vars = [c for c in col_names if any(k in c.lower() for k in ['bust', 'fail', 'large_error', 'extreme'])]

        # Pairing verification
        has_paired_fcst_obs = (len(forecast_vars) > 0 and len(obs_vars) > 0) or len(error_vars) > 0

        # Suitability Assessment
        suitability = {
            "weather_prediction": len(num_cols) >= 3 and len(date_cols) >= 1,
            "forecast_error_prediction": has_paired_fcst_obs and (len(lead_time_vars) > 0 or 'lead_time_hours' in col_names or 'forecast_day' in col_names),
            "forecast_bust_classification": has_paired_fcst_obs or len(bust_vars) > 0,
            "historical_verification": has_paired_fcst_obs and len(date_cols) >= 1
        }

        # Validation messages
        validation_messages = []
        if not has_paired_fcst_obs:
            validation_messages.append("WARNING: Dataset lacks paired Forecast and Observation columns. Cannot calculate actual forecast verification errors.")
        else:
            validation_messages.append("SUCCESS: Paired forecast and observation data identified. Suitable for verification and bust modeling.")

        if dup_count > 0:
            validation_messages.append(f"NOTICE: {dup_count} duplicate rows detected. De-duplication recommended prior to training.")
        
        if len(missing_vals) > 0:
            validation_messages.append(f"NOTICE: Missing values found in {len(missing_vals)} columns. Imputation required.")

        return {
            "rows": rows,
            "columns": cols,
            "column_names": col_names,
            "missing_values": missing_vals,
            "duplicate_records": dup_count,
            "numerical_features": num_cols,
            "categorical_features": cat_cols,
            "date_range": date_range_str,
            "geographical_coverage": geo_str,
            "forecast_variables": forecast_vars,
            "observation_variables": obs_vars,
            "forecast_observation_paired": has_paired_fcst_obs,
            "suitability": suitability,
            "validation_messages": validation_messages
        }

    def get_dataframe(self) -> pd.DataFrame:
        if self._df is None:
            self.load_and_inspect()
        return self._df
