from typing import Dict, Any, Tuple

class WeatherEventClassifier:
    """
    Modular weather-event classification system.
    Identifies extreme or rapidly evolving synoptic weather systems:
      - Normal
      - Heavy Rainfall
      - Cyclone
      - Monsoon Depression
      - Heat Wave
      - Western Disturbance
      - Active Monsoon
      - Break Monsoon
      - Rapid Transition
    Distinguishes ground-truth labels from rule-inferred experimental classifications.
    """

    EVENT_REGIMES = [
        "Normal",
        "Heavy Rainfall",
        "Cyclone",
        "Monsoon Depression",
        "Heat Wave",
        "Western Disturbance",
        "Active Monsoon",
        "Break Monsoon",
        "Rapid Transition"
    ]

    @classmethod
    def classify_event(cls, data: Dict[str, Any]) -> Tuple[str, bool, str]:
        """
        Returns (event_name, is_inferred, scientific_rationale).
        """
        # If an explicit label exists in data, respect it
        if "weather_event" in data and data["weather_event"]:
            lbl = str(data["weather_event"])
            if lbl in cls.EVENT_REGIMES:
                return lbl, False, f"Official meteorological event classification: {lbl}"

        # Otherwise apply rule-based synoptic heuristics
        temp = float(data.get("temperature", 28.0))
        rainfall = float(data.get("rainfall", 0.0))
        pressure = float(data.get("pressure", 1010.0))
        wind_speed = float(data.get("wind_speed", 12.0))
        month = int(data.get("month", 7))
        lat = float(data.get("latitude", 20.0))

        # Tropical Cyclone criteria
        if wind_speed >= 28.0 and pressure <= 992.0:
            return "Cyclone", True, "Inferred from severe cyclonic wind (>28 m/s) and central pressure deficit (<992 hPa)"

        # Monsoon Depression criteria
        if month in [6, 7, 8, 9] and pressure <= 998.0 and wind_speed >= 17.0:
            return "Monsoon Depression", True, "Inferred from low-pressure system (<998 hPa) and sustained monsoon gales"

        # Heavy Rainfall criteria (IMD: >= 64.5 mm/day)
        if rainfall >= 64.5:
            return "Heavy Rainfall", True, "Inferred from 24h precipitation accumulation exceeding 64.5 mm"

        # Heat Wave criteria (IMD: temp >= 40°C in plains or >= 4.5°C departure)
        if temp >= 42.0:
            return "Heat Wave", True, "Inferred from maximum surface temperature >= 42.0°C"

        # Western Disturbance (Winter / Pre-Monsoon in North India)
        if month in [11, 12, 1, 2, 3] and lat >= 27.0 and rainfall >= 10.0:
            return "Western Disturbance", True, "Inferred from winter extra-tropical precipitation episode in northern latitudes"

        # Active vs Break Monsoon
        if month in [6, 7, 8, 9]:
            if rainfall >= 25.0:
                return "Active Monsoon", True, "Inferred from vigorous monsoon surge (>25 mm rainfall)"
            elif rainfall < 2.0 and pressure > 1008.0:
                return "Break Monsoon", True, "Inferred from monsoon break spell with suppressed precipitation and pressure rise"

        # Rapid Transition (rapid baroclinic pressure swing)
        if abs(pressure - 1013.0) >= 8.0:
            return "Rapid Transition", True, "Inferred from steep synoptic pressure tendency and frontal gradient"

        return "Normal", True, "Synoptic conditions within normal seasonal climatological range"

weather_event_classifier = WeatherEventClassifier()
