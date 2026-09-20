from app.config import settings
from app.models.schemas import SeverityLevel

SEVERITY_SCORES = {
    SeverityLevel.CRITICAL: 100.0,
    SeverityLevel.HIGH: 75.0,
    SeverityLevel.MODERATE: 50.0,
    SeverityLevel.LOW: 25.0,
    "Critical": 100.0,
    "High": 75.0,
    "Moderate": 50.0,
    "Low": 25.0,
}

def calculate_priority_score(
    severity: str,
    eta_seconds: float,
    distance_meters: float,
    hospital_readiness: float = 80.0
) -> dict:
    """
    Calculates the LifeLane AI Emergency Priority Score:
    Priority Score = Severity * 0.40 + ETA Urgency * 0.30 + Distance Urgency * 0.20 + Hospital Urgency * 0.10
    All components normalized 0 - 100.
    """
    # 1. Severity Score (0 - 100)
    sev_score = SEVERITY_SCORES.get(severity, 50.0)

    # 2. ETA Urgency (0 - 100)
    # The shorter the ETA to intersection, the higher the urgency.
    # Arrival in <= 10s gives 100 urgency; >= 300s gives ~0 urgency.
    eta_clamped = max(0.0, min(300.0, float(eta_seconds)))
    eta_urgency = max(0.0, 100.0 - (eta_clamped / 300.0) * 100.0)

    # 3. Distance Urgency (0 - 100)
    # Closer distance implies imminent intersection arrival
    # <= 50m = 100; >= 2000m = ~0
    dist_clamped = max(0.0, min(2000.0, float(distance_meters)))
    distance_urgency = max(0.0, 100.0 - (dist_clamped / 2000.0) * 100.0)

    # 4. Hospital Urgency (0 - 100)
    # Reflects the receiving facility's urgency/preparedness
    hospital_urgency = max(0.0, min(100.0, float(hospital_readiness)))

    # Weighted Sum
    total_score = (
        (sev_score * settings.WEIGHT_SEVERITY) +
        (eta_urgency * settings.WEIGHT_ETA) +
        (distance_urgency * settings.WEIGHT_DISTANCE) +
        (hospital_urgency * settings.WEIGHT_HOSPITAL)
    )

    return {
        "severity_score": round(sev_score, 1),
        "eta_urgency_score": round(eta_urgency, 1),
        "distance_urgency_score": round(distance_urgency, 1),
        "hospital_urgency_score": round(hospital_urgency, 1),
        "total_priority": round(total_score, 1),
        "formula": "Severity * 0.40 + ETA * 0.30 + Distance * 0.20 + Hospital * 0.10"
    }
