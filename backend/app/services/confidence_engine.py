from typing import Dict, Any, Tuple
from app.core.config import settings

class ForecastConfidenceEngine:
    """
    Dedicated Meteorological Forecast Confidence Engine.
    Synthesizes:
      1. ML-predicted forecast error
      2. ML-predicted bust probability
      3. Forecast lead time decay
      4. Historical regional NWP error distribution
      5. Model uncertainty / ensemble spread
    Into a calibrated confidence index (0-100) and discrete operational category.
    """

    def __init__(
        self,
        th_very_high: float = settings.CONFIDENCE_VERY_HIGH,
        th_high: float = settings.CONFIDENCE_HIGH,
        th_medium: float = settings.CONFIDENCE_MEDIUM,
        th_low: float = settings.CONFIDENCE_LOW,
    ):
        self.th_very_high = th_very_high
        self.th_high = th_high
        self.th_medium = th_medium
        self.th_low = th_low

    def update_thresholds(self, v_high: float, high: float, med: float, low: float):
        self.th_very_high = v_high
        self.th_high = high
        self.th_medium = med
        self.th_low = low

    def get_thresholds(self) -> Dict[str, float]:
        return {
            "very_high": self.th_very_high,
            "high": self.th_high,
            "medium": self.th_medium,
            "low": self.th_low
        }

    def compute_confidence(
        self,
        predicted_error: float,
        bust_probability: float,
        forecast_lead_time_days: int,
        historical_error: float = 3.0,
        model_uncertainty: float = 0.15
    ) -> Tuple[float, str, Dict[str, float]]:
        """
        Calculates calibrated confidence score (0 to 100) and category.
        
        Formula considerations:
          - Bust probability penalty (weight: 45%)
          - Error relative to historical mean penalty (weight: 25%)
          - Lead time predictability horizon decay (weight: 20%)
          - Model uncertainty penalty (weight: 10%)
        """
        # 1. Bust Probability component: 1.0 prob -> 0 score, 0.0 prob -> 100 score
        bust_score = max(0.0, 100.0 * (1.0 - bust_probability))

        # 2. Error magnitude penalty relative to expected climatology
        # error ratio: 1.0 means typical error, > 2.0 means large expected error
        norm_error = predicted_error / max(1.0, historical_error)
        error_score = max(0.0, min(100.0, 100.0 - (norm_error - 0.5) * 45.0))

        # 3. Synoptic lead time decay: Day 1 has high synoptic predictability (~95%),
        # Day 10 synoptic skill approaches climatological threshold (~40%)
        lead_score = max(20.0, 100.0 - (forecast_lead_time_days - 1) * 7.5)

        # 4. Model uncertainty / spread penalty
        uncertainty_score = max(0.0, 100.0 * (1.0 - min(1.0, model_uncertainty * 2.0)))

        # Weighted composite confidence score
        raw_score = (
            0.45 * bust_score +
            0.25 * error_score +
            0.20 * lead_score +
            0.10 * uncertainty_score
        )

        confidence_score = round(max(5.0, min(98.0, raw_score)), 1)

        # Assign discrete operational category
        if confidence_score >= self.th_very_high:
            category = "VERY HIGH"
        elif confidence_score >= self.th_high:
            category = "HIGH"
        elif confidence_score >= self.th_medium:
            category = "MEDIUM"
        elif confidence_score >= self.th_low:
            category = "LOW"
        else:
            category = "VERY LOW"

        components = {
            "bust_factor": round(bust_score, 1),
            "error_magnitude_factor": round(error_score, 1),
            "lead_time_decay_factor": round(lead_score, 1),
            "uncertainty_factor": round(uncertainty_score, 1)
        }

        return confidence_score, category, components

confidence_engine = ForecastConfidenceEngine()
