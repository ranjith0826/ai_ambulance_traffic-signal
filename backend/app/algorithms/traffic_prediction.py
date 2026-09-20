from datetime import datetime
from typing import Dict, Any

def predict_traffic_conditions(hour: int = None, day_of_week: int = None) -> Dict[str, Any]:
    """
    Simulates traffic congestion conditions based on time-of-day and day-of-week.
    Clearly designated as Simulation Data.
    """
    now = datetime.now()
    if hour is None:
        hour = now.hour
    if day_of_week is None:
        day_of_week = now.weekday() # 0 = Monday, 6 = Sunday

    is_weekend = day_of_week >= 5

    # Morning rush: 8 - 10 AM, Evening rush: 5 - 8 PM
    if (8 <= hour <= 10) or (17 <= hour <= 20):
        level = "HIGH" if is_weekend else "SEVERE"
        delay_factor = 1.45 if is_weekend else 1.85
        average_speed_kmh = 24.0 if is_weekend else 18.0
        congestion_index = 88 if not is_weekend else 72
    elif (11 <= hour <= 16):
        level = "MODERATE"
        delay_factor = 1.30
        average_speed_kmh = 35.0
        congestion_index = 54
    elif (21 <= hour <= 23):
        level = "MODERATE"
        delay_factor = 1.15
        average_speed_kmh = 42.0
        congestion_index = 38
    else: # Late night / early morning 0 - 7
        level = "LOW"
        delay_factor = 1.05
        average_speed_kmh = 55.0
        congestion_index = 18

    return {
        "traffic_level": level,
        "congestion_index": congestion_index, # 0 - 100
        "delay_factor": delay_factor,
        "estimated_traffic_speed_kmh": average_speed_kmh,
        "hour_evaluated": hour,
        "day_evaluated": day_of_week,
        "is_weekend": is_weekend,
        "label": "Simulation Data (Synthetic Historical Model)",
        "recommendation": "Priority Corridors Highly Recommended" if level in ["HIGH", "SEVERE"] else "Standard Corridors Active"
    }

def calculate_what_if_comparison(
    distance_km: float,
    num_signals: int = 6,
    base_traffic_level: str = "HIGH"
) -> Dict[str, Any]:
    """
    Side-by-side What-If comparison:
    WITHOUT LifeLane AI (normal signals, standard traffic, red light wait times)
    vs
    WITH LifeLane AI (green corridor preemption, conflict resolution, optimal routing).
    """
    # Average signal red cycle wait ~ 45-75 seconds without preemption
    signal_delay_without_sec = num_signals * 55 # seconds
    # With LifeLane AI, virtual green corridor preempts signals so delay is ~ 4s for safety clearance
    signal_delay_with_sec = num_signals * 4

    # Travel speed
    speed_without_kmh = 28.0 if base_traffic_level in ["HIGH", "SEVERE"] else 38.0
    speed_with_kmh = 48.0 if base_traffic_level in ["HIGH", "SEVERE"] else 55.0

    travel_time_without_sec = (distance_km / speed_without_kmh) * 3600
    travel_time_with_sec = (distance_km / speed_with_kmh) * 3600

    total_time_without_sec = travel_time_without_sec + signal_delay_without_sec
    total_time_with_sec = travel_time_with_sec + signal_delay_with_sec

    time_saved_sec = max(0.0, total_time_without_sec - total_time_with_sec)
    time_saved_minutes = round(time_saved_sec / 60.0, 1)
    
    improvement_percent = round((time_saved_sec / max(1.0, total_time_without_sec)) * 100.0, 1)

    return {
        "distance_km": round(distance_km, 2),
        "signals_count": num_signals,
        "without_lifelane": {
            "travel_time_minutes": round(travel_time_without_sec / 60.0, 1),
            "signal_delay_minutes": round(signal_delay_without_sec / 60.0, 1),
            "total_time_minutes": round(total_time_without_sec / 60.0, 1),
            "average_speed_kmh": speed_without_kmh,
            "status": "Conventional Traffic Flow"
        },
        "with_lifelane": {
            "travel_time_minutes": round(travel_time_with_sec / 60.0, 1),
            "signal_delay_minutes": round(signal_delay_with_sec / 60.0, 1),
            "total_time_minutes": round(total_time_with_sec / 60.0, 1),
            "average_speed_kmh": speed_with_kmh,
            "status": "Green Corridor & Conflict Priority Active"
        },
        "time_saved_minutes": time_saved_minutes,
        "percentage_improvement": improvement_percent,
        "data_label": "SIMULATED RESULTS"
    }
