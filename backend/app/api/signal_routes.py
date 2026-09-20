from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.auth.dependencies import get_current_user, require_role
from app.database import get_signals_col
from app.models.schemas import TrafficSignalCreate, SignalOverrideRequest
from app.services.audit_service import log_audit_event
from app.websocket.sio import emit_signal_changed

router = APIRouter(prefix="/api/signals", tags=["Traffic Signals"])

@router.get("")
async def list_signals():
    col = get_signals_col()
    cursor = col.find()
    signals = []
    async for s in cursor:
        signals.append({
            "id": str(s["_id"]),
            "name": s.get("name"),
            "intersection_id": s.get("intersection_id"),
            "location": s.get("location"),
            "status": s.get("status", "GREEN"),
            "emergency_corridor_active": s.get("emergency_corridor_active", False),
            "approaching_ambulance_id": s.get("approaching_ambulance_id"),
            "approaching_ambulance_number": s.get("approaching_ambulance_number"),
            "distance_to_signal": s.get("distance_to_signal"),
            "eta_seconds": s.get("eta_seconds"),
            "cycle_time_seconds": s.get("cycle_time_seconds", 60),
            "updated_at": s.get("updated_at")
        })
    return {"signals": signals}

@router.post("")
async def create_signal(payload: TrafficSignalCreate, current_user: dict = Depends(get_current_user)):
    col = get_signals_col()
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["updated_at"] = now_iso

    res = await col.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    await log_audit_event(
        action="SIGNAL_CREATED",
        entity="TrafficSignal",
        entity_id=doc["id"],
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"name": payload.name, "intersection_id": payload.intersection_id}
    )

    return {"message": "Traffic signal registered.", "signal": doc}

@router.post("/{signal_id}/override")
async def override_signal(
    signal_id: str,
    payload: SignalOverrideRequest,
    current_user: dict = Depends(require_role(["traffic_officer", "admin"]))
):
    col = get_signals_col()
    try:
        query = {"_id": ObjectId(signal_id)}
    except Exception:
        query = {"_id": signal_id}

    sig = await col.find_one(query)
    if not sig:
        raise HTTPException(status_code=404, detail="Traffic signal not found.")

    new_status = payload.action # "EMERGENCY_GREEN" | "NORMAL" | "HOLD"
    if new_status == "NORMAL":
        new_status = "GREEN"

    corridor_active = True if payload.action == "EMERGENCY_GREEN" else False

    update_doc = {
        "status": new_status,
        "emergency_corridor_active": corridor_active,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if payload.ambulance_id:
        update_doc["approaching_ambulance_id"] = payload.ambulance_id

    await col.update_one(query, {"$set": update_doc})
    updated = await col.find_one(query)
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])

    # Broadcast via websocket
    await emit_signal_changed(updated)

    await log_audit_event(
        action=f"MANUAL_SIGNAL_OVERRIDE_{payload.action}",
        entity="TrafficSignal",
        entity_id=signal_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"action": payload.action, "reason": payload.reason or "Manual Officer Override"}
    )

    return {"message": f"Signal status updated to {new_status}.", "signal": updated}
