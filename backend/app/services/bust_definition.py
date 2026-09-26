from typing import Dict, Any, Optional
from app.core.config import settings

class BustDefinitionManager:
    """
    Configurable Forecast Bust Definition Engine.
    Scientifically defines when an operational forecast error crosses the threshold
    to be classified as a 'forecast bust'.
    """

    def __init__(
        self,
        threshold_temp_c: float = settings.DEFAULT_BUST_THRESHOLD_TEMP_C,
        threshold_rain_mm: float = settings.DEFAULT_BUST_THRESHOLD_RAIN_MM,
        threshold_wind_ms: float = settings.DEFAULT_BUST_THRESHOLD_WIND_MS,
        threshold_pressure_hpa: float = settings.DEFAULT_BUST_THRESHOLD_PRESSURE_HPA,
    ):
        self.threshold_temp_c = threshold_temp_c
        self.threshold_rain_mm = threshold_rain_mm
        self.threshold_wind_ms = threshold_wind_ms
        self.threshold_pressure_hpa = threshold_pressure_hpa

    def get_thresholds(self) -> Dict[str, float]:
        return {
            "temperature_c": self.threshold_temp_c,
            "rainfall_mm": self.threshold_rain_mm,
            "wind_speed_ms": self.threshold_wind_ms,
            "pressure_hpa": self.threshold_pressure_hpa
        }

    def update_thresholds(self, new_thresholds: Dict[str, float]) -> None:
        if "temperature_c" in new_thresholds:
            self.threshold_temp_c = float(new_thresholds["temperature_c"])
        if "rainfall_mm" in new_thresholds:
            self.threshold_rain_mm = float(new_thresholds["rainfall_mm"])
        if "wind_speed_ms" in new_thresholds:
            self.threshold_wind_ms = float(new_thresholds["wind_speed_ms"])
        if "pressure_hpa" in new_thresholds:
            self.threshold_pressure_hpa = float(new_thresholds["pressure_hpa"])

    def evaluate_bust(self, variable: str, forecast_val: float, observed_val: float) -> tuple[int, float, str]:
        """
        Calculates error and returns (is_bust: 0 or 1, absolute_error, reason_description).
        """
        abs_err = abs(forecast_val - observed_val)
        v = variable.lower()

        if "temp" in v:
            thresh = self.threshold_temp_c
            unit = "°C"
        elif "rain" in v or "precip" in v:
            thresh = self.threshold_rain_mm
            unit = "mm/day"
        elif "wind" in v:
            thresh = self.threshold_wind_ms
            unit = "m/s"
        elif "pres" in v:
            thresh = self.threshold_pressure_hpa
            unit = "hPa"
        else:
            thresh = self.threshold_rain_mm
            unit = "units"

        is_bust = 1 if abs_err > thresh else 0
        desc = (
            f"Forecast error {abs_err:.1f} {unit} EXCEEDS bust threshold ({thresh:.1f} {unit})"
            if is_bust == 1 else
            f"Forecast error {abs_err:.1f} {unit} within operational tolerance (<= {thresh:.1f} {unit})"
        )
        return is_bust, round(abs_err, 2), desc

bust_manager = BustDefinitionManager()
