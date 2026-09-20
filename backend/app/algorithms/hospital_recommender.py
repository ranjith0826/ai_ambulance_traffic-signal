from typing import List, Dict, Any
from app.algorithms.green_corridor import haversine_distance_meters

SPECIALTY_REQUIREMENTS = {
    "Cardiac": ["Cardiology", "Intensive Care"],
    "Stroke": ["Neurology", "Neuro ICU"],
    "Accident": ["Trauma", "Orthopedics", "Emergency Medicine"],
    "Trauma": ["Trauma", "Surgery", "Emergency Medicine"],
    "Other": ["General Medicine", "Emergency Medicine"]
}

def rank_hospitals(
    patient_location: Dict[str, float],
    emergency_type: str,
    severity: str,
    hospitals: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks registered hospitals based on proximity, capacity, specialist match,
    and emergency readiness score.
    """
    required_specialties = SPECIALTY_REQUIREMENTS.get(emergency_type, ["Emergency Medicine"])
    ranked = []

    for hosp in hospitals:
        loc = hosp.get("location", {})
        h_lat = loc.get("latitude", 0.0)
        h_lon = loc.get("longitude", 0.0)

        dist_m = haversine_distance_meters(
            patient_location["latitude"],
            patient_location["longitude"],
            h_lat,
            h_lon
        )
        dist_km = round(dist_m / 1000.0, 2)
        # Assume average urban ambulance speed ~ 45 km/h
        eta_minutes = round(max(1.0, (dist_km / 45.0) * 60.0), 1)

        emergency_beds = hosp.get("emergency_beds_available", 0)
        icu_beds = hosp.get("icu_beds_available", 0)
        ventilators = hosp.get("ventilators_available", 0)
        specialists = hosp.get("specialists", [])
        readiness = hosp.get("emergency_readiness", 80)

        # 1. Proximity Score (0 - 35 pts): closer is better
        # 1km -> 35 pts, 20km -> ~5 pts
        dist_score = max(0.0, 35.0 - (dist_km / 20.0) * 30.0)

        # 2. Bed Availability Score (0 - 25 pts)
        bed_score = 0.0
        if emergency_beds > 0:
            bed_score += min(15.0, emergency_beds * 3.0)
        if severity in ["High", "Critical"]:
            if icu_beds > 0:
                bed_score += min(10.0, icu_beds * 5.0)
        else:
            bed_score += min(10.0, emergency_beds * 2.0)

        # 3. Specialist Match Score (0 - 25 pts)
        matches = [s for s in required_specialties if any(s.lower() in spec.lower() for spec in specialists)]
        match_ratio = len(matches) / max(1, len(required_specialties))
        specialist_score = match_ratio * 25.0

        # 4. Readiness Score (0 - 15 pts)
        readiness_score = (readiness / 100.0) * 15.0

        total_match_score = round(dist_score + bed_score + specialist_score + readiness_score, 1)

        # Badges
        badges = []
        if match_ratio >= 0.5:
            badges.append("Specialist On-Call")
        if emergency_beds > 3:
            badges.append("Emergency Beds Available")
        if icu_beds > 1 and severity in ["Critical", "High"]:
            badges.append("ICU Ready")
        if dist_km < 4.0:
            badges.append("Rapid Proximity")

        ranked.append({
            "id": str(hosp.get("_id", hosp.get("id"))),
            "name": hosp.get("name"),
            "address": hosp.get("address"),
            "location": loc,
            "phone": hosp.get("phone"),
            "distance_km": dist_km,
            "eta_minutes": eta_minutes,
            "emergency_beds_available": emergency_beds,
            "icu_beds_available": icu_beds,
            "ventilators_available": ventilators,
            "specialists": specialists,
            "emergency_readiness": readiness,
            "match_score": total_match_score,
            "badges": badges,
            "recommended": False
        })

    # Sort descending by match score
    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    if ranked:
        ranked[0]["recommended"] = True
        if "Top Recommended" not in ranked[0]["badges"]:
            ranked[0]["badges"].insert(0, "Top Recommended")

    return ranked
