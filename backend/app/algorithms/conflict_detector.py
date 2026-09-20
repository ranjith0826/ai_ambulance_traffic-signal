from datetime import datetime, timezone
from typing import List, Dict, Any
from app.algorithms.priority_engine import calculate_priority_score
from app.config import settings

def detect_and_resolve_conflicts(
    intersection_id: str,
    intersection_name: str,
    approaching_ambulances: List[Dict[str, Any]],
    conflict_window_seconds: int = settings.CONFLICT_WINDOW_SECONDS
) -> Dict[str, Any]:
    """
    Evaluates approaching ambulances at a single virtual intersection.
    If 2 or more ambulances arrive within conflict_window_seconds (default 30s)
    with conflicting paths, detects a conflict and resolves it using priority scores.
    """
    if not approaching_ambulances or len(approaching_ambulances) < 2:
        return {
            "conflict_detected": False,
            "intersection_id": intersection_id,
            "intersection_name": intersection_name,
            "conflict_window_seconds": conflict_window_seconds,
            "ambulances_in_conflict": approaching_ambulances,
            "priority_breakdowns": [],
            "granted_ambulance_id": approaching_ambulances[0]["ambulance_id"] if approaching_ambulances else None,
            "granted_ambulance_number": approaching_ambulances[0]["ambulance_number"] if approaching_ambulances else None,
            "granted_direction": approaching_ambulances[0].get("direction") if approaching_ambulances else None,
            "held_ambulances": [],
            "decision_reason": "Single vehicle approach or no conflict.",
            "system_action": "GRANT_PASSAGE" if approaching_ambulances else "STANDBY",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # Sort approaching ambulances by ETA to identify arrival time overlap
    sorted_by_eta = sorted(approaching_ambulances, key=lambda a: a.get("eta_seconds", 999.0))
    min_eta = sorted_by_eta[0].get("eta_seconds", 0.0)

    # Filter ambulances within the conflict window
    conflicting = [
        amb for amb in sorted_by_eta
        if (amb.get("eta_seconds", 999.0) - min_eta) <= conflict_window_seconds
    ]

    if len(conflicting) < 2:
        return {
            "conflict_detected": False,
            "intersection_id": intersection_id,
            "intersection_name": intersection_name,
            "conflict_window_seconds": conflict_window_seconds,
            "ambulances_in_conflict": sorted_by_eta,
            "priority_breakdowns": [],
            "granted_ambulance_id": sorted_by_eta[0]["ambulance_id"],
            "granted_ambulance_number": sorted_by_eta[0]["ambulance_number"],
            "granted_direction": sorted_by_eta[0].get("direction"),
            "held_ambulances": sorted_by_eta[1:],
            "decision_reason": f"Arrival times spaced apart (> {conflict_window_seconds}s window).",
            "system_action": "SEQUENTIAL_CLEARANCE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # Conflict detected! Calculate priority score for each ambulance
    priority_breakdowns = []
    evaluated_ambulances = []

    for amb in conflicting:
        calc = calculate_priority_score(
            severity=amb.get("severity", "Moderate"),
            eta_seconds=amb.get("eta_seconds", 30.0),
            distance_meters=amb.get("distance_meters", 300.0),
            hospital_readiness=amb.get("hospital_readiness", 80.0)
        )
        
        breakdown = {
            "ambulance_id": amb.get("ambulance_id"),
            "ambulance_number": amb.get("ambulance_number"),
            "driver_name": amb.get("driver_name", "Driver"),
            "direction": amb.get("direction", "North -> South"),
            "severity": amb.get("severity"),
            "eta_seconds": amb.get("eta_seconds"),
            "distance_meters": amb.get("distance_meters"),
            "severity_score": calc["severity_score"],
            "eta_score": calc["eta_urgency_score"],
            "distance_score": calc["distance_urgency_score"],
            "hospital_score": calc["hospital_urgency_score"],
            "total_priority": calc["total_priority"]
        }
        priority_breakdowns.append(breakdown)
        
        amb_copy = amb.copy()
        amb_copy["priority_score"] = calc["total_priority"]
        evaluated_ambulances.append(amb_copy)

    # Sort descending by priority score
    priority_breakdowns.sort(key=lambda x: x["total_priority"], reverse=True)
    winner = priority_breakdowns[0]
    held = priority_breakdowns[1:]

    reason = (
        f"Ambulance {winner['ambulance_number']} granted EMERGENCY GREEN (Score: {winner['total_priority']}) "
        f"over conflicting approaches: {', '.join([h['ambulance_number'] + ' (Score: ' + str(h['total_priority']) + ')' for h in held])}. "
        f"Factor breakdown: Severity ({winner['severity_score']}) + ETA Urgency ({winner['eta_score']}) + "
        f"Distance ({winner['distance_score']}) + Hospital ({winner['hospital_score']})."
    )

    return {
        "conflict_detected": True,
        "intersection_id": intersection_id,
        "intersection_name": intersection_name,
        "conflict_window_seconds": conflict_window_seconds,
        "ambulances_in_conflict": evaluated_ambulances,
        "priority_breakdowns": priority_breakdowns,
        "granted_ambulance_id": winner["ambulance_id"],
        "granted_ambulance_number": winner["ambulance_number"],
        "granted_direction": winner["direction"],
        "held_ambulances": held,
        "decision_reason": reason,
        "system_action": "EMERGENCY_GREEN_GRANTED_WITH_HOLD",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
