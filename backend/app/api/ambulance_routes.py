from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
from app.auth.dependencies import get_current_user, require_role
from app.database import get_ambulances_col
from app.models.schemas import AmbulanceCreate, Location
from app.websocket.sio import emit_ambulance_location
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/ambulances", tags=["Ambulances"])

@router.get("")
async def list_ambulances():
    col = get_ambulances_col()
    cursor = col.find()
    ambulances = []
    async for a in cursor:
        ambulances.append({
            "id": str(a["_id"]),
            "ambulance_number": a.get("ambulance_number"),
            "driver_id": a.get("driver_id"),
            "driver_name": a.get("driver_name"),
            "status": a.get("status", "available"),
            "current_location": a.get("current_location", {"latitude": 12.9716, "longitude": 77.5946}),
            "heading": a.get("heading", 0.0),
            "speed": a.get("speed", 0.0),
            "active_trip_id": a.get("active_trip_id"),
            "updated_at": a.get("updated_at")
        })
    return {"ambulances": ambulances}

@router.post("")
async def create_ambulance(payload: AmbulanceCreate, current_user: dict = Depends(get_current_user)):
    col = get_ambulances_col()
    existing = await col.find_one({"ambulance_number": payload.ambulance_number.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Ambulance number already exists.")

    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "ambulance_number": payload.ambulance_number.upper(),
        "driver_id": payload.driver_id or current_user["id"],
        "driver_name": payload.driver_name or current_user.get("name"),
        "status": payload.status,
        "current_location": payload.current_location.model_dump(),
        "heading": payload.heading,
        "speed": payload.speed,
        "active_trip_id": None,
        "updated_at": now_iso
    }
    res = await col.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    await log_audit_event(
        action="AMBULANCE_CREATED",
        entity="Ambulance",
        entity_id=doc["id"],
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"ambulance_number": payload.ambulance_number}
    )

    return {"message": "Ambulance created successfully.", "ambulance": doc}

@router.get("/{ambulance_id}")
async def get_ambulance(ambulance_id: str):
    col = get_ambulances_col()
    try:
        query = {"_id": ObjectId(ambulance_id)}
    except Exception:
        query = {"_id": ambulance_id}

    amb = await col.find_one(query)
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found.")

    return {
        "ambulance": {
            "id": str(amb["_id"]),
            "ambulance_number": amb.get("ambulance_number"),
            "driver_id": amb.get("driver_id"),
            "driver_name": amb.get("driver_name"),
            "status": amb.get("status", "available"),
            "current_location": amb.get("current_location"),
            "heading": amb.get("heading", 0.0),
            "speed": amb.get("speed", 0.0),
            "active_trip_id": amb.get("active_trip_id"),
            "updated_at": amb.get("updated_at")
        }
    }
