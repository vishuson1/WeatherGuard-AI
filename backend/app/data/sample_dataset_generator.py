import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_historical_verification_dataset(output_path: str = "backend/app/data/historical_verification_2018_2025.csv") -> str:
    """
    Generates a realistic, chronologically ordered meteorological verification dataset
    spanning 2018-2025 across representative meteorological subdivisions in India.
    Includes Forecasts, Observations, Atmospheric Sounding proxies, Lead Times (1-10 days),
    and verified event labels.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    np.random.seed(42)
    regions = [
        {"name": "Odisha Coastal", "lat": 20.27, "lon": 85.84, "coastal": True, "cyclone_prone": True},
        {"name": "Kerala Coast", "lat": 9.93, "lon": 76.26, "coastal": True, "monsoon_heavy": True},
        {"name": "Maharashtra (Mumbai/Konkan)", "lat": 18.98, "lon": 72.83, "coastal": True, "monsoon_heavy": True},
        {"name": "Gujarat Coastal", "lat": 21.64, "lon": 69.60, "coastal": True, "cyclone_prone": True},
        {"name": "Rajasthan (West)", "lat": 26.91, "lon": 70.90, "coastal": False, "heatwave_prone": True},
        {"name": "Himachal Pradesh", "lat": 31.10, "lon": 77.17, "coastal": False, "western_disturbance": True},
        {"name": "West Bengal (Gangetic)", "lat": 22.57, "lon": 88.36, "coastal": True, "cyclone_prone": True},
        {"name": "Assam & Meghalaya", "lat": 26.14, "lon": 91.73, "coastal": False, "monsoon_heavy": True},
    ]

    records = []
    # Dates: from 2018-01-01 to 2025-10-31 (daily or regular synoptic sampling)
    # Generate approx 5,000 multi-lead-time paired forecast-observation records
    base_date = datetime(2018, 1, 1)
    end_date = datetime(2025, 10, 31)
    
    current_date = base_date
    step_days = 7 # sample every week across 8 regions for manageable fast training while retaining rich seasonal variance
    
    while current_date <= end_date:
        year = current_date.year
        month = current_date.month
        day = current_date.day
        
        # Season identification
        if month in [1, 2]:
            season = "Winter"
        elif month in [3, 4, 5]:
            season = "Pre-Monsoon"
        elif month in [6, 7, 8, 9]:
            season = "Monsoon"
        else:
            season = "Post-Monsoon"

        for reg in regions:
            # Baseline climate according to season & region
            if season == "Monsoon":
                base_temp = 28.0 + np.random.normal(0, 1.5)
                base_rh = 82.0 + np.random.normal(0, 6.0)
                base_pres = 1004.0 + np.random.normal(0, 3.0)
                base_rain = np.random.exponential(12.0) if reg.get("monsoon_heavy") or reg.get("cyclone_prone") else np.random.exponential(4.0)
                base_wind = 14.0 + np.random.normal(0, 3.0)
                
                # Weather event regime
                if base_rain > 65.0:
                    event = "Heavy Rainfall"
                elif reg.get("cyclone_prone") and base_pres < 996.0:
                    event = "Monsoon Depression"
                else:
                    event = "Active Monsoon" if month in [7, 8] else "Normal"
            elif season == "Pre-Monsoon":
                base_temp = 36.0 + np.random.normal(0, 3.0)
                base_rh = 50.0 + np.random.normal(0, 10.0)
                base_pres = 1010.0 + np.random.normal(0, 2.5)
                base_rain = np.random.exponential(2.0)
                base_wind = 10.0 + np.random.normal(0, 2.5)
                if base_temp > 42.0:
                    event = "Heat Wave"
                elif reg.get("cyclone_prone") and np.random.rand() < 0.08:
                    event = "Cyclone"
                else:
                    event = "Normal"
            elif season == "Winter":
                base_temp = 20.0 + np.random.normal(0, 3.5)
                base_rh = 60.0 + np.random.normal(0, 8.0)
                base_pres = 1016.0 + np.random.normal(0, 2.0)
                base_rain = np.random.exponential(1.0)
                base_wind = 8.0 + np.random.normal(0, 2.0)
                if reg.get("western_disturbance") and np.random.rand() < 0.25:
                    event = "Western Disturbance"
                    base_rain = 18.0 + np.random.normal(0, 5.0)
                else:
                    event = "Normal"
            else: # Post-Monsoon
                base_temp = 26.0 + np.random.normal(0, 2.0)
                base_rh = 70.0 + np.random.normal(0, 8.0)
                base_pres = 1013.0 + np.random.normal(0, 2.0)
                base_rain = np.random.exponential(6.0) if reg.get("coastal") else np.random.exponential(1.5)
                base_wind = 11.0 + np.random.normal(0, 3.0)
                if reg.get("cyclone_prone") and np.random.rand() < 0.12:
                    event = "Cyclone"
                    base_wind = 32.0 + np.random.normal(0, 6.0)
                    base_pres = 988.0 + np.random.normal(0, 5.0)
                    base_rain = 85.0 + np.random.normal(0, 20.0)
                else:
                    event = "Normal"

            base_rh = max(15.0, min(100.0, base_rh))
            base_rain = max(0.0, base_rain)

            # Sample 2 lead times for this synoptic date (e.g. Day 1, 3, 5, 7, 10)
            chosen_days = np.random.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], size=2, replace=False)
            
            for fcst_day in chosen_days:
                lead_hours = fcst_day * 24
                
                # Atmospheric physics: forecast error grows non-linearly with lead time and rapid transition / extreme events
                lead_err_scale = 1.0 + (fcst_day - 1) * 0.28
                event_err_multiplier = 2.4 if event in ["Cyclone", "Monsoon Depression", "Heavy Rainfall"] else (1.6 if event in ["Western Disturbance", "Heat Wave"] else 1.0)
                
                # Synthetic NWP forecast value vs Observed ground truth
                obs_temp = round(base_temp, 1)
                obs_rain = round(base_rain, 1)
                obs_pres = round(base_pres, 1)
                obs_wind = round(base_wind, 1)

                temp_error = np.random.normal(0, 0.8 * lead_err_scale * (1.2 if event == "Heat Wave" else 1.0))
                rain_error = np.random.normal(0, (2.0 + 0.25 * obs_rain) * lead_err_scale * event_err_multiplier)
                pres_error = np.random.normal(0, 0.6 * lead_err_scale * (1.8 if "Cyclone" in event else 1.0))
                wind_error = np.random.normal(0, 1.2 * lead_err_scale * (2.0 if "Cyclone" in event else 1.0))

                fcst_temp = round(obs_temp + temp_error, 1)
                fcst_rain = round(max(0.0, obs_rain + rain_error), 1)
                fcst_pres = round(obs_pres + pres_error, 1)
                fcst_wind = round(max(1.0, obs_wind + wind_error), 1)

                # Actual absolute errors
                abs_temp_err = abs(fcst_temp - obs_temp)
                abs_rain_err = abs(fcst_rain - obs_rain)
                abs_pres_err = abs(fcst_pres - obs_pres)
                abs_wind_err = abs(fcst_wind - obs_wind)

                # Bust condition: rain error > 20mm or temp error > 3°C or wind error > 7m/s or pres error > 3hPa
                is_bust = 1 if (abs_rain_err > 20.0 or abs_temp_err > 3.0 or abs_wind_err > 7.0 or abs_pres_err > 3.0) else 0

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "year": year,
                    "month": month,
                    "day": day,
                    "season": season,
                    "region": reg["name"],
                    "latitude": reg["lat"],
                    "longitude": reg["lon"],
                    "forecast_day": int(fcst_day),
                    "lead_time_hours": int(lead_hours),
                    "weather_event": event,
                    # Forecast NWP values
                    "forecast_temperature": fcst_temp,
                    "forecast_humidity": round(base_rh, 1),
                    "forecast_pressure": fcst_pres,
                    "forecast_rainfall": fcst_rain,
                    "forecast_wind_speed": fcst_wind,
                    "forecast_wind_direction": float(np.random.randint(0, 360)),
                    "forecast_cloud_cover": float(np.random.randint(10, 95)),
                    # Observed Ground Truth
                    "observed_temperature": obs_temp,
                    "observed_humidity": round(base_rh + np.random.normal(0, 4.0), 1),
                    "observed_pressure": obs_pres,
                    "observed_rainfall": obs_rain,
                    "observed_wind_speed": obs_wind,
                    # Verification metrics
                    "absolute_temp_error": round(abs_temp_err, 2),
                    "absolute_rain_error": round(abs_rain_err, 2),
                    "target_forecast_error": round(abs_rain_err if obs_rain > 5.0 else abs_temp_err, 2),
                    "is_forecast_bust": is_bust
                })
        
        current_date += timedelta(days=step_days)

    df = pd.DataFrame(records)
    # Sort strictly chronologically to eliminate any data leakage
    df = df.sort_values(by=["date", "forecast_day"]).reset_index(drop=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} chronologically verified forecast-observation records at {output_path}")
    return output_path

if __name__ == "__main__":
    generate_historical_verification_dataset()
