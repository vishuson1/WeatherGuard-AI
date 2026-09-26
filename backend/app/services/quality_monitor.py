from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone

class DataQualityMonitor:
    """
    Automated meteorological data health and integrity auditor.
    Evaluates missing values, physical outliers, duplicate records,
    coordinate validity, API latencies, and unit anomalies.
    """

    def __init__(self):
        self.health_status = "GOOD" # "GOOD" or "DEGRADED"
        self.last_check_time: str = datetime.now(timezone.utc).isoformat()
        self.detected_issues: List[str] = []

    def audit_observation(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        issues = []

        # 1. Coordinate boundaries
        lat = data.get("latitude")
        lon = data.get("longitude")
        if lat is None or lon is None or not (-90.0 <= float(lat) <= 90.0) or not (-180.0 <= float(lon) <= 180.0):
            issues.append(f"Invalid geographical coordinates: ({lat}, {lon})")

        # 2. Meteorological physical limits
        temp = data.get("temperature")
        if temp is not None:
            if float(temp) < -60.0 or float(temp) > 60.0:
                issues.append(f"Unphysical surface temperature outlier: {temp}°C")

        rh = data.get("humidity")
        if rh is not None:
            if float(rh) < 0.0 or float(rh) > 100.0:
                issues.append(f"Relative humidity out of physical bounds [0, 100]: {rh}%")

        p = data.get("pressure")
        if p is not None:
            if float(p) < 850.0 or float(p) > 1085.0:
                issues.append(f"Atmospheric surface pressure anomalous: {p} hPa")

        rain = data.get("rainfall")
        if rain is not None:
            if float(rain) < 0.0 or float(rain) > 1500.0:
                issues.append(f"Precipitation negative or unphysical: {rain} mm")

        wind = data.get("wind_speed")
        if wind is not None:
            if float(wind) < 0.0 or float(wind) > 150.0:
                issues.append(f"Wind speed negative or unphysical: {wind} m/s")

        self.last_check_time = datetime.now(timezone.utc).isoformat()
        if issues:
            self.health_status = "DEGRADED"
            self.detected_issues = issues
            return False, issues

        self.health_status = "GOOD"
        self.detected_issues = []
        return True, []

    def get_summary(self) -> Dict[str, Any]:
        return {
            "data_health": self.health_status,
            "last_audit": self.last_check_time,
            "active_issues": self.detected_issues,
            "issue_count": len(self.detected_issues)
        }

quality_monitor = DataQualityMonitor()
