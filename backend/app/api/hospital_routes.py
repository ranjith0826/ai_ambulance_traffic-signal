from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.database import get_hospitals_col
from app.models.schemas import HospitalCreate, HospitalAvailabilityUpdate, Location
from app.algorithms.hospital_recommender import rank_hospitals
from app.services.audit_service import log_audit_event
from app.websocket.sio import emit_hospital_updated, emit_hospital_accepted

router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])

class RecommendRequest(BaseModel):
    current_location: Location
    emergency_type: str
    severity: str

class TriageActionRequest(BaseModel):
    trip_id: str
    ambulance_number: str
    action: str # "ACCEPT" | "REJECT"
    notes: Optional[str] = None

@router.get("")
async def list_hospitals():
    col = get_hospitals_col()
    cursor = col.find()
    hospitals = []
    async for h in cursor:
        hospitals.append({
            "id": str(h["_id"]),
            "name": h.get("name"),
            "address": h.get("address"),
            "location": h.get("location"),
            "phone": h.get("phone"),
            "emergency_beds": h.get("emergency_beds", 10),
            "emergency_beds_available": h.get("emergency_beds_available", 5),
            "icu_beds": h.get("icu_beds", 5),
            "icu_beds_available": h.get("icu_beds_available", 2),
            "ventilators": h.get("ventilators", 4),
            "ventilators_available": h.get("ventilators_available", 2),
            "specialists": h.get("specialists", []),
            "emergency_readiness": h.get("emergency_readiness", 90),
            "incoming_patients_count": h.get("incoming_patients_count", 0),
            "updated_at": h.get("updated_at")
        })
    return {"hospitals": hospitals}

@router.post("")
async def create_hospital(payload: HospitalCreate, current_user: dict = Depends(get_current_user)):
    col = get_hospitals_col()
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["created_by"] = current_user["id"]
    doc["updated_at"] = now_iso
    doc["incoming_patients_count"] = 0

    res = await col.insert_one(doc)
    doc["id"] = str(res.inserted_id)

    await log_audit_event(
        action="HOSPITAL_CREATED",
        entity="Hospital",
        entity_id=doc["id"],
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"name": payload.name, "emergency_beds": payload.emergency_beds}
    )

    return {"message": "Hospital registered successfully.", "hospital": doc}

@router.put("/{hospital_id}/availability")
async def update_availability(
    hospital_id: str,
    payload: HospitalAvailabilityUpdate,
    current_user: dict = Depends(get_current_user)
):
    col = get_hospitals_col()
    try:
        query = {"_id": ObjectId(hospital_id)}
    except Exception:
        query = {"_id": hospital_id}

    hosp = await col.find_one(query)
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    update_fields = {
        "emergency_beds_available": payload.emergency_beds_available,
        "icu_beds_available": payload.icu_beds_available,
        "ventilators_available": payload.ventilators_available,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if payload.specialists is not None:
        update_fields["specialists"] = payload.specialists
    if payload.emergency_readiness is not None:
        update_fields["emergency_readiness"] = payload.emergency_readiness

    await col.update_one(query, {"$set": update_fields})
    updated = await col.find_one(query)
    updated["id"] = str(updated["_id"])

    # Broadcast via websocket
    await emit_hospital_updated(updated)

    await log_audit_event(
        action="HOSPITAL_CAPACITY_UPDATED",
        entity="Hospital",
        entity_id=hospital_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details=update_fields
    )

    return {"message": "Hospital availability updated.", "hospital": updated}

@router.post("/{hospital_id}/triage")
async def handle_triage(
    hospital_id: str,
    payload: TriageActionRequest,
    current_user: dict = Depends(get_current_user)
):
    col = get_hospitals_col()
    try:
        query = {"_id": ObjectId(hospital_id)}
    except Exception:
        query = {"_id": hospital_id}

    hosp = await col.find_one(query)
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    if payload.action == "ACCEPT":
        # Decrement available emergency bed if > 0
        current_beds = hosp.get("emergency_beds_available", 1)
        new_beds = max(0, current_beds - 1)
        inc_patients = hosp.get("incoming_patients_count", 0) + 1
        await col.update_one(query, {
            "$set": {
                "emergency_beds_available": new_beds,
                "incoming_patients_count": inc_patients,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        })
        await emit_hospital_accepted({
            "hospital_id": hospital_id,
            "hospital_name": hosp.get("name"),
            "trip_id": payload.trip_id,
            "ambulance_number": payload.ambulance_number,
            "status": "ACCEPTED"
        })
        action_name = "HOSPITAL_ACCEPTED_PATIENT"
    else:
        action_name = "HOSPITAL_UNAVAILABLE_PATIENT"

    await log_audit_event(
        action=action_name,
        entity="Hospital",
        entity_id=hospital_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"trip_id": payload.trip_id, "ambulance": payload.ambulance_number, "action": payload.action}
    )

    return {"message": f"Patient triage recorded: {payload.action}", "action": payload.action}

@router.post("/recommend")
async def recommend_hospitals_api(payload: RecommendRequest):
    col = get_hospitals_col()
    cursor = col.find()
    hospitals = []
    async for h in cursor:
        hospitals.append(h)

    if not hospitals:
        raise HTTPException(status_code=404, detail="No registered hospitals found.")

    ranked = rank_hospitals(
        patient_location=payload.current_location.model_dump(),
        emergency_type=payload.emergency_type,
        severity=payload.severity,
        hospitals=hospitals
    )

    return {
        "recommended_hospital": ranked[0] if ranked else None,
        "alternatives": ranked[1:] if len(ranked) > 1 else [],
        "all_ranked": ranked
    }
