from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.models.schemas import (
    ConflictDetectionRequest,
    ConflictResolutionResponse,
    ApproachingAmbulanceInfo
)
from app.algorithms.priority_engine import calculate_priority_score
from app.algorithms.conflict_detector import detect_and_resolve_conflicts
from app.database import get_conflicts_col, get_signals_col
from app.services.audit_service import log_audit_event
from app.websocket.sio import emit_conflict_detected, emit_conflict_resolved, emit_signal_changed

router = APIRouter(prefix="", tags=["Priority & Conflicts"])

@router.post("/api/priority/calculate")
async def calculate_priority(payload: Dict[str, Any]):
    sev = payload.get("severity", "Moderate")
    eta_sec = float(payload.get("eta_seconds", 30.0))
    dist_m = float(payload.get("distance_meters", 300.0))
    hosp_readiness = float(payload.get("hospital_readiness", 80.0))

    result = calculate_priority_score(
        severity=sev,
        eta_seconds=eta_sec,
        distance_meters=dist_m,
        hospital_readiness=hosp_readiness
    )
    return result

@router.post("/api/conflicts/detect")
async def detect_conflict(payload: ConflictDetectionRequest):
    ambulances_data = [amb.model_dump() for amb in payload.ambulances]
    result = detect_and_resolve_conflicts(
        intersection_id=payload.intersection_id,
        intersection_name=payload.intersection_name,
        approaching_ambulances=ambulances_data
    )
    return result

@router.post("/api/conflicts/resolve")
async def resolve_conflict_execution(payload: ConflictDetectionRequest):
    conflicts_col = get_conflicts_col()
    signals_col = get_signals_col()

    ambulances_data = [amb.model_dump() for amb in payload.ambulances]
    result = detect_and_resolve_conflicts(
        intersection_id=payload.intersection_id,
        intersection_name=payload.intersection_name,
        approaching_ambulances=ambulances_data
    )

    # Persist conflict incident
    doc_to_save = dict(result)
    await conflicts_col.insert_one(doc_to_save)

    # If conflict detected, emit alerts and preempt virtual signal
    if result["conflict_detected"]:
        await emit_conflict_detected(result)
        
        # Grant EMERGENCY_GREEN to winning approach
        winner_id = result.get("granted_ambulance_id")
        winner_num = result.get("granted_ambulance_number")
        
        # Update matching signal
        sig = await signals_col.find_one({"intersection_id": payload.intersection_id})
        if sig:
            await signals_col.update_one(
                {"_id": sig["_id"]},
                {"$set": {
                    "status": "EMERGENCY_GREEN",
                    "approaching_ambulance_id": winner_id,
                    "approaching_ambulance_number": winner_num,
                    "emergency_corridor_active": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            sig["status"] = "EMERGENCY_GREEN"
            sig["id"] = str(sig["_id"])
            await emit_signal_changed(sig)

        await emit_conflict_resolved(result)

        await log_audit_event(
            action="CONFLICT_RESOLVED",
            entity="Intersection",
            entity_id=payload.intersection_id,
            details={
                "intersection": payload.intersection_name,
                "winner": winner_num,
                "held": [h.get("ambulance_number") for h in result.get("held_ambulances", [])],
                "reason": result.get("decision_reason")
            }
        )

    return result

@router.get("/api/conflicts/active")
async def get_recent_conflicts():
    col = get_conflicts_col()
    cursor = col.find().sort("timestamp", -1).limit(20)
    conflicts = []
    async for c in cursor:
        c["id"] = str(c["_id"])
        conflicts.append(c)
    return {"conflicts": conflicts}
