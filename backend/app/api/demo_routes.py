from fastapi import APIRouter
from app.algorithms.priority_engine import calculate_priority_score
from app.algorithms.conflict_detector import detect_and_resolve_conflicts
from app.algorithms.traffic_prediction import calculate_what_if_comparison
from app.algorithms.hospital_recommender import rank_hospitals
from app.database import get_hospitals_col

router = APIRouter(prefix="/api/demo", tags=["Demo Scenarios"])

@router.get("/scenario/1")
async def get_demo_scenario_1():
    """DEMO 1: Single Ambulance Green Corridor Preemption"""
    return {
        "scenario_id": 1,
        "title": "DEMO 1 — Single Ambulance Priority Corridor",
        "description": "Ambulance KA-01-EA-1001 initiates a Critical emergency trip to Apex Care Hospital. Virtual signals along the corridor automatically pre-empt to EMERGENCY GREEN as the vehicle reaches the 500m geofence.",
        "ambulance": {
            "ambulance_number": "KA-01-EA-1001",
            "driver": "Rajesh Kumar",
            "emergency_type": "Cardiac",
            "severity": "Critical",
            "speed_kmh": 65.0
        },
        "signals": [
            {"name": "Victoria Road Junction", "distance_m": 420, "status": "EMERGENCY_GREEN", "eta_sec": 23},
            {"name": "Central Circle Signal", "distance_m": 1250, "status": "GREEN", "eta_sec": 69},
            {"name": "Hospital Avenue Node", "distance_m": 2100, "status": "RED", "eta_sec": 116}
        ],
        "destination_hospital": "Apex Care Super Specialty Hospital",
        "distance_km": 4.8,
        "estimated_time_saved_minutes": 8.5
    }

@router.get("/scenario/2")
async def get_demo_scenario_2():
    """DEMO 2: Multi-Ambulance Conflict Resolution at Cross Junction"""
    approaching = [
        {
            "ambulance_id": "amb-a",
            "ambulance_number": "KA-01-EA-1001",
            "driver_name": "Rajesh Kumar",
            "direction": "North -> South",
            "approach_angle": 180.0,
            "severity": "Critical",
            "eta_seconds": 18.0,
            "distance_meters": 280.0,
            "hospital_readiness": 95.0,
            "hospital_name": "CityCare Hospital"
        },
        {
            "ambulance_id": "amb-b",
            "ambulance_number": "KA-04-MB-2045",
            "driver_name": "Suresh Patel",
            "direction": "East -> West",
            "approach_angle": 270.0,
            "severity": "High",
            "eta_seconds": 21.0,
            "distance_meters": 320.0,
            "hospital_readiness": 88.0,
            "hospital_name": "Metro General"
        }
    ]
    resolution = detect_and_resolve_conflicts(
        intersection_id="INT-CENTRAL-01",
        intersection_name="Central Junction (MG Road & Brigade)",
        approaching_ambulances=approaching,
        conflict_window_seconds=30
    )
    return {
        "scenario_id": 2,
        "title": "DEMO 2 — Multi-Ambulance Conflict Resolution",
        "intersection": "Central Junction",
        "resolution": resolution,
        "step_timeline": [
            {"step": 1, "action": "Conflict Detected", "detail": "Ambulance A and B arrival times overlap within 30s window."},
            {"step": 2, "action": "Priority Computation", "detail": "Ambulance A (Critical, Score 92.4) vs Ambulance B (High, Score 78.6)."},
            {"step": 3, "action": "Signal Preemption", "detail": "Ambulance A granted EMERGENCY GREEN. Ambulance B commanded HOLD."},
            {"step": 4, "action": "Clearance & Handover", "detail": "Ambulance A clears intersection. Ambulance B queued and granted EMERGENCY GREEN."},
            {"step": 5, "action": "Restoration", "detail": "Both vehicles safely cleared. Virtual signal smoothly reverts to normal cycle."}
        ]
    }

@router.get("/scenario/3")
async def get_demo_scenario_3():
    """DEMO 3: Smart Hospital Recommendation"""
    hosp_col = get_hospitals_col()
    cursor = hosp_col.find()
    hospitals = [h async for h in cursor]
    if not hospitals:
        hospitals = [
            {"name": "CityCare Super Specialty", "location": {"latitude": 12.9780, "longitude": 77.5995}, "emergency_beds_available": 6, "icu_beds_available": 3, "ventilators_available": 2, "specialists": ["Cardiology", "Neurology", "Trauma"], "emergency_readiness": 95},
            {"name": "Metro General Hospital", "location": {"latitude": 12.9650, "longitude": 77.6050}, "emergency_beds_available": 2, "icu_beds_available": 0, "ventilators_available": 1, "specialists": ["Orthopedics", "General Medicine"], "emergency_readiness": 78}
        ]

    ranked = rank_hospitals(
        patient_location={"latitude": 12.9716, "longitude": 77.5946},
        emergency_type="Cardiac",
        severity="Critical",
        hospitals=hospitals
    )
    return {
        "scenario_id": 3,
        "title": "DEMO 3 — Smart Hospital Recommendation Engine",
        "patient_condition": {"type": "Cardiac", "severity": "Critical"},
        "recommendations": ranked
    }

@router.get("/scenario/4")
async def get_demo_scenario_4():
    """DEMO 4: What-If Time Saved Comparative Analysis"""
    comparison = calculate_what_if_comparison(distance_km=8.2, num_signals=6, base_traffic_level="HIGH")
    return {
        "scenario_id": 4,
        "title": "DEMO 4 — What-If Travel Time Analysis",
        "comparison": comparison
    }
