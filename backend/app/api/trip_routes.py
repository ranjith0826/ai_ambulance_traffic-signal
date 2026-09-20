from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
from app.auth.dependencies import get_current_user
from app.database import get_trips_col, get_ambulances_col, get_hospitals_col, get_signals_col
from app.models.schemas import TripStartRequest, TripLocationUpdate, TripEndRequest
from app.algorithms.priority_engine import calculate_priority_score
from app.algorithms.route_generator import calculate_route, is_route_deviated
from app.algorithms.green_corridor import evaluate_signals_for_corridor, haversine_distance_meters
from app.algorithms.traffic_prediction import calculate_what_if_comparison
from app.services.audit_service import log_audit_event
from app.websocket.sio import (
    emit_emergency_started,
    emit_emergency_completed,
    emit_ambulance_location,
    emit_signal_changed,
    emit_green_corridor_activated,
    emit_green_corridor_restored,
    emit_route_deviation,
    emit_route_updated
)

router = APIRouter(prefix="/api/trips", tags=["Trips & Emergencies"])

@router.post("/start")
async def start_emergency(payload: TripStartRequest, current_user: dict = Depends(get_current_user)):
    trips_col = get_trips_col()
    amb_col = get_ambulances_col()
    hosp_col = get_hospitals_col()
    sig_col = get_signals_col()

    # 1. Fetch ambulance
    try:
        amb_query = {"_id": ObjectId(payload.ambulance_id)}
    except Exception:
        amb_query = {"_id": payload.ambulance_id}
    amb = await amb_col.find_one(amb_query)
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found.")

    # 2. Fetch hospital
    try:
        hosp_query = {"_id": ObjectId(payload.hospital_id)}
    except Exception:
        hosp_query = {"_id": payload.hospital_id}
    hosp = await hosp_col.find_one(hosp_query)
    if not hosp:
        raise HTTPException(status_code=404, detail="Destination hospital not found.")

    # 3. Calculate route
    hosp_loc = hosp.get("location", {})
    route_data = calculate_route(
        start_lat=payload.current_location.latitude,
        start_lon=payload.current_location.longitude,
        end_lat=hosp_loc.get("latitude", 12.9780),
        end_lon=hosp_loc.get("longitude", 77.5995)
    )

    # 4. Calculate initial Priority Score
    priority_result = calculate_priority_score(
        severity=payload.severity.value,
        eta_seconds=route_data["duration_minutes"] * 60.0,
        distance_meters=route_data["distance_km"] * 1000.0,
        hospital_readiness=hosp.get("emergency_readiness", 85.0)
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    trip_doc = {
        "ambulance_id": str(amb["_id"]),
        "ambulance_number": amb.get("ambulance_number"),
        "driver_id": current_user["id"],
        "driver_name": current_user.get("name"),
        "hospital_id": str(hosp["_id"]),
        "hospital_name": hosp.get("name"),
        "emergency_type": payload.emergency_type.value,
        "severity": payload.severity.value,
        "status": "active",
        "priority_score": priority_result["total_priority"],
        "priority_breakdown": priority_result,
        "source": payload.current_location.model_dump(),
        "destination": hosp_loc,
        "current_location": payload.current_location.model_dump(),
        "speed_kmh": payload.speed_kmh,
        "eta_minutes": route_data["duration_minutes"],
        "distance_remaining_km": route_data["distance_km"],
        "total_distance_km": route_data["distance_km"],
        "travel_time_seconds": 0,
        "estimated_time_saved_minutes": round(route_data["duration_minutes"] * 0.42, 1),
        "signals_prioritized_count": 0,
        "conflicts_resolved_count": 0,
        "route_coordinates": route_data["coordinates"],
        "route_source": route_data["source"],
        "started_at": now_iso,
        "ended_at": None
    }

    res = await trips_col.insert_one(trip_doc)
    trip_id = str(res.inserted_id)
    trip_doc["id"] = trip_id
    trip_doc["_id"] = trip_id

    # 5. Update ambulance status
    await amb_col.update_one(
        {"_id": amb["_id"]},
        {"$set": {
            "status": "busy",
            "active_trip_id": trip_id,
            "current_location": payload.current_location.model_dump(),
            "updated_at": now_iso
        }}
    )

    # 6. Check signals near origin for immediate corridor trigger
    signals_cursor = sig_col.find()
    signals_list = [s async for s in signals_cursor]
    eval_signals = evaluate_signals_for_corridor(
        ambulance_location=payload.current_location.model_dump(),
        ambulance_id=trip_doc["ambulance_id"],
        ambulance_number=trip_doc["ambulance_number"],
        speed_kmh=payload.speed_kmh,
        signals=signals_list
    )

    for es in eval_signals:
        if es["in_corridor"]:
            await sig_col.update_one(
                {"_id": ObjectId(es["signal_id"])},
                {"$set": {
                    "status": "EMERGENCY_GREEN",
                    "emergency_corridor_active": True,
                    "approaching_ambulance_id": trip_doc["ambulance_id"],
                    "approaching_ambulance_number": trip_doc["ambulance_number"],
                    "distance_to_signal": es["distance_meters"],
                    "eta_seconds": es["eta_seconds"],
                    "updated_at": now_iso
                }}
            )
            await emit_green_corridor_activated({
                "signal_id": es["signal_id"],
                "signal_name": es["name"],
                "ambulance_number": trip_doc["ambulance_number"],
                "distance_meters": es["distance_meters"],
                "eta_seconds": es["eta_seconds"]
            })

    # 7. Broadcast and Audit
    await emit_emergency_started(trip_doc)
    await log_audit_event(
        action="EMERGENCY_STARTED",
        entity="Trip",
        entity_id=trip_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={
            "ambulance_number": trip_doc["ambulance_number"],
            "hospital": trip_doc["hospital_name"],
            "severity": trip_doc["severity"],
            "priority_score": trip_doc["priority_score"]
        }
    )

    return {"message": "Emergency corridor initialized.", "trip": trip_doc}

@router.post("/{trip_id}/location")
async def update_trip_location(trip_id: str, payload: TripLocationUpdate):
    trips_col = get_trips_col()
    amb_col = get_ambulances_col()
    sig_col = get_signals_col()

    try:
        t_query = {"_id": ObjectId(trip_id)}
    except Exception:
        t_query = {"_id": trip_id}
        
    trip = await trips_col.find_one(t_query)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    new_loc = {"latitude": payload.latitude, "longitude": payload.longitude}

    # Distance to destination
    dest = trip.get("destination", {})
    dist_to_dest_m = haversine_distance_meters(
        payload.latitude, payload.longitude,
        dest.get("latitude", payload.latitude),
        dest.get("longitude", payload.longitude)
    )
    dist_remaining_km = round(dist_to_dest_m / 1000.0, 2)
    speed_kmh = payload.speed if payload.speed > 0 else trip.get("speed_kmh", 55.0)
    eta_min = round(max(0.2, (dist_remaining_km / max(10.0, speed_kmh)) * 60.0), 1)

    # Route deviation check
    deviated, drift_dist = is_route_deviated(
        payload.latitude, payload.longitude,
        trip.get("route_coordinates", [])
    )
    if deviated:
        await emit_route_deviation({
            "trip_id": trip_id,
            "ambulance_number": trip.get("ambulance_number"),
            "drift_distance_meters": drift_dist,
            "message": "Ambulance drifted off planned corridor. Dynamic reroute recommended."
        })

    # Evaluate signals for green corridor triggers (500m geofence)
    signals_cursor = sig_col.find()
    signals_list = [s async for s in signals_cursor]
    eval_signals = evaluate_signals_for_corridor(
        ambulance_location=new_loc,
        ambulance_id=trip.get("ambulance_id"),
        ambulance_number=trip.get("ambulance_number"),
        speed_kmh=speed_kmh,
        signals=signals_list
    )

    prioritized_inc = 0
    for es in eval_signals:
        sig_id = es["signal_id"]
        try:
            s_q = {"_id": ObjectId(sig_id)}
        except Exception:
            s_q = {"_id": sig_id}

        if es["in_corridor"]:
            await sig_col.update_one(s_q, {"$set": {
                "status": "EMERGENCY_GREEN",
                "emergency_corridor_active": True,
                "approaching_ambulance_id": trip.get("ambulance_id"),
                "approaching_ambulance_number": trip.get("ambulance_number"),
                "distance_to_signal": es["distance_meters"],
                "eta_seconds": es["eta_seconds"],
                "updated_at": now_iso
            }})
            prioritized_inc += 1
            await emit_green_corridor_activated({
                "signal_id": sig_id,
                "signal_name": es["name"],
                "ambulance_number": trip.get("ambulance_number"),
                "distance_meters": es["distance_meters"],
                "eta_seconds": es["eta_seconds"]
            })
        elif es["previous_status"] == "EMERGENCY_GREEN" and not es["in_corridor"]:
            # Vehicle passed intersection, restore normal signal
            await sig_col.update_one(s_q, {"$set": {
                "status": "GREEN",
                "emergency_corridor_active": False,
                "approaching_ambulance_id": None,
                "approaching_ambulance_number": None,
                "updated_at": now_iso
            }})
            await emit_green_corridor_restored({
                "signal_id": sig_id,
                "signal_name": es["name"],
                "status": "GREEN"
            })

    # Update trip record
    update_doc = {
        "current_location": new_loc,
        "distance_remaining_km": dist_remaining_km,
        "eta_minutes": eta_min,
        "signals_prioritized_count": trip.get("signals_prioritized_count", 0) + (1 if prioritized_inc > 0 else 0)
    }
    await trips_col.update_one(t_query, {"$set": update_doc})

    # Update ambulance record
    try:
        a_q = {"_id": ObjectId(trip.get("ambulance_id"))}
    except Exception:
        a_q = {"_id": trip.get("ambulance_id")}

    await amb_col.update_one(a_q, {"$set": {
        "current_location": new_loc,
        "speed": speed_kmh,
        "heading": payload.heading,
        "updated_at": now_iso
    }})

    # Broadcast location update to all command screens
    loc_payload = {
        "trip_id": trip_id,
        "ambulance_id": trip.get("ambulance_id"),
        "ambulance_number": trip.get("ambulance_number"),
        "current_location": new_loc,
        "speed": speed_kmh,
        "heading": payload.heading,
        "eta_minutes": eta_min,
        "distance_remaining_km": dist_remaining_km
    }
    await emit_ambulance_location(loc_payload)

    return {"message": "Location updated.", "data": loc_payload}

@router.post("/{trip_id}/end")
async def end_emergency(
    trip_id: str,
    payload: TripEndRequest,
    current_user: dict = Depends(get_current_user)
):
    trips_col = get_trips_col()
    amb_col = get_ambulances_col()
    sig_col = get_signals_col()

    try:
        t_query = {"_id": ObjectId(trip_id)}
    except Exception:
        t_query = {"_id": trip_id}

    trip = await trips_col.find_one(t_query)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Calculate travel duration
    started_at_str = trip.get("started_at")
    travel_time_sec = 480 # default 8 min if parse fail
    try:
        st = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
        travel_time_sec = int((now - st).total_seconds())
    except Exception:
        pass

    # Calculate What-If simulated time saved
    what_if = calculate_what_if_comparison(
        distance_km=trip.get("total_distance_km", 6.5),
        num_signals=max(3, trip.get("signals_prioritized_count", 4)),
        base_traffic_level="HIGH"
    )

    update_fields = {
        "status": "completed",
        "ended_at": now_iso,
        "travel_time_seconds": travel_time_sec,
        "distance_remaining_km": 0.0,
        "eta_minutes": 0.0,
        "estimated_time_saved_minutes": what_if["time_saved_minutes"],
        "notes": payload.notes or "Trip completed safely at emergency facility.",
        "what_if_summary": what_if
    }

    await trips_col.update_one(t_query, {"$set": update_fields})
    trip.update(update_fields)
    trip["id"] = str(trip["_id"])
    trip["_id"] = str(trip["_id"])

    # Release ambulance to available
    try:
        a_q = {"_id": ObjectId(trip.get("ambulance_id"))}
    except Exception:
        a_q = {"_id": trip.get("ambulance_id")}
    await amb_col.update_one(a_q, {"$set": {"status": "available", "active_trip_id": None, "updated_at": now_iso}})

    # Restore any remaining green corridor signals for this ambulance
    await sig_col.update_many(
        {"approaching_ambulance_id": trip.get("ambulance_id")},
        {"$set": {
            "status": "GREEN",
            "emergency_corridor_active": False,
            "approaching_ambulance_id": None,
            "approaching_ambulance_number": None,
            "updated_at": now_iso
        }}
    )

    await emit_emergency_completed(trip)
    await emit_green_corridor_restored({"status": "ALL_SIGNALS_RESTORED"})

    await log_audit_event(
        action="EMERGENCY_COMPLETED",
        entity="Trip",
        entity_id=trip_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={
            "ambulance_number": trip.get("ambulance_number"),
            "travel_time_seconds": travel_time_sec,
            "time_saved_minutes": what_if["time_saved_minutes"]
        }
    )

    return {
        "message": "Emergency successfully ended. Corridor restored to normal cycle.",
        "trip_summary": trip
    }

@router.get("/active")
async def get_active_trips():
    col = get_trips_col()
    cursor = col.find({"status": "active"}).sort("started_at", -1)
    trips = []
    async for t in cursor:
        t["id"] = str(t["_id"])
        t["_id"] = str(t["_id"])
        trips.append(t)
    return {"active_trips": trips}

@router.get("/history")
async def get_trip_history():
    col = get_trips_col()
    cursor = col.find({"status": {"$in": ["completed", "cancelled"]}}).sort("ended_at", -1).limit(50)
    trips = []
    async for t in cursor:
        t["id"] = str(t["_id"])
        t["_id"] = str(t["_id"])
        trips.append(t)
    return {"trips": trips}

@router.get("/{trip_id}")
async def get_trip(trip_id: str):
    col = get_trips_col()
    try:
        query = {"_id": ObjectId(trip_id)}
    except Exception:
        query = {"_id": trip_id}
        
    t = await col.find_one(query)
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found.")
    t["id"] = str(t["_id"])
    t["_id"] = str(t["_id"])
    return {"trip": t}
