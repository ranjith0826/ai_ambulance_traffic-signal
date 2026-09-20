import math
from typing import List, Dict, Any, Tuple
from app.config import settings

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def evaluate_signals_for_corridor(
    ambulance_location: Dict[str, float],
    ambulance_id: str,
    ambulance_number: str,
    speed_kmh: float,
    signals: List[Dict[str, Any]],
    corridor_threshold_meters: float = settings.GREEN_CORRIDOR_DISTANCE_METERS
) -> List[Dict[str, Any]]:
    """
    Evaluates list of virtual signals against ambulance position.
    Signals within 500m threshold transition to EMERGENCY_GREEN.
    Computes estimated ETA to each signal.
    """
    results = []
    speed_ms = max(5.0, (speed_kmh * 1000.0) / 3600.0) # at least 5 m/s

    for sig in signals:
        sig_loc = sig.get("location", {})
        sig_lat = sig_loc.get("latitude", 0.0)
        sig_lon = sig_loc.get("longitude", 0.0)
        
        dist = haversine_distance_meters(
            ambulance_location["latitude"],
            ambulance_location["longitude"],
            sig_lat,
            sig_lon
        )
        eta_sec = round(dist / speed_ms, 1)

        # Signal state determination
        is_in_corridor = dist <= corridor_threshold_meters
        current_status = sig.get("status", "GREEN")
        new_status = current_status

        if is_in_corridor:
            new_status = "EMERGENCY_GREEN"
            corridor_active = True
        else:
            # If ambulance has passed far (> 600m) or was approaching, normal cycle restores
            if current_status == "EMERGENCY_GREEN" and sig.get("approaching_ambulance_id") == ambulance_id:
                new_status = "GREEN"
                corridor_active = False
            else:
                corridor_active = sig.get("emergency_corridor_active", False)

        results.append({
            "signal_id": str(sig.get("_id", sig.get("id"))),
            "name": sig.get("name"),
            "intersection_id": sig.get("intersection_id"),
            "distance_meters": round(dist, 1),
            "eta_seconds": eta_sec,
            "in_corridor": is_in_corridor,
            "previous_status": current_status,
            "new_status": new_status,
            "emergency_corridor_active": corridor_active,
            "approaching_ambulance_id": ambulance_id if is_in_corridor else sig.get("approaching_ambulance_id"),
            "approaching_ambulance_number": ambulance_number if is_in_corridor else sig.get("approaching_ambulance_number")
        })

    return results
