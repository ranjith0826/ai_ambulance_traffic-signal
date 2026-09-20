import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("========================================")
    print("LIFELANE AI — AUTOMATED END-TO-END TESTS")
    print("========================================")

    # 1. Health Check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check Passed:", res.json())

    # 2. Login as Seed Admin
    login_payload = {"email": "admin@lifelane.ai", "password": "Admin@123456"}
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin Login Passed. Role:", res.json()["user"]["role"])

    # 3. Register a New Ambulance Driver (Prompt Section 3, 4, 50)
    import time
    unique_email = f"testdriver_{int(time.time())}@lifelane.ai"
    reg_payload = {
        "name": "New Test Driver",
        "email": unique_email,
        "phone": "+91 99999 88888",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "role": "driver",
        "ambulance_number": f"KA-09-TST-{int(time.time())%10000}",
        "driver_license": "DL-TEST-999"
    }
    res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    driver_token = res.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    driver_user = res.json()["user"]
    print(f"[PASS] New Driver Registration Passed: {unique_email} with Ambulance: {driver_user['ambulance_number']}")

    # 4. Fetch Hospitals and Select Destination
    res = requests.get(f"{BASE_URL}/api/hospitals")
    assert res.status_code == 200 and len(res.json()["hospitals"]) > 0
    hospitals = res.json()["hospitals"]
    dest_hospital = hospitals[0]
    print(f"[PASS] Found {len(hospitals)} Registered Hospitals. Target: {dest_hospital['name']}")

    # 5. Smart Hospital Recommendation API (Section 27)
    rec_payload = {
        "current_location": {"latitude": 12.9650, "longitude": 77.5850},
        "emergency_type": "Cardiac",
        "severity": "Critical"
    }
    res = requests.post(f"{BASE_URL}/api/hospitals/recommend", json=rec_payload)
    assert res.status_code == 200
    top_rec = res.json()["recommended_hospital"]
    print(f"[PASS] Smart Hospital Recommendation Passed. Top Pick: {top_rec['name']} (Score: {top_rec['match_score']})")

    # 6. Start Emergency Trip (Section 11, 12, 13)
    start_trip_payload = {
        "ambulance_id": driver_user["ambulance_id"],
        "emergency_type": "Cardiac",
        "severity": "Critical",
        "hospital_id": dest_hospital["id"],
        "current_location": {"latitude": 12.9650, "longitude": 77.5850},
        "simulation_mode": True,
        "speed_kmh": 65.0
    }
    res = requests.post(f"{BASE_URL}/api/trips/start", json=start_trip_payload, headers=driver_headers)
    assert res.status_code == 200, f"Trip start failed: {res.text}"
    trip = res.json()["trip"]
    trip_id = trip["id"]
    print(f"[PASS] Emergency Started Passed. Trip ID: {trip_id}, Priority Score: {trip['priority_score']}, Initial ETA: {trip['eta_minutes']} min")

    # 7. Update Trip Coordinates along route (Section 15, 18)
    coords = trip["route_coordinates"]
    mid_point = coords[len(coords)//2]
    loc_payload = {
        "latitude": mid_point[0],
        "longitude": mid_point[1],
        "speed": 65.0,
        "heading": 90.0
    }
    res = requests.post(f"{BASE_URL}/api/trips/{trip_id}/location", json=loc_payload)
    assert res.status_code == 200
    print(f"[PASS] Location Update Passed. Position stepped to: {mid_point}")

    # 8. End Emergency and verify Trip Completion Summary (Section 40)
    end_payload = {"notes": "Patient delivered to emergency triage safely."}
    res = requests.post(f"{BASE_URL}/api/trips/{trip_id}/end", json=end_payload, headers=driver_headers)
    assert res.status_code == 200
    summary = res.json()["trip_summary"]
    assert summary["status"] == "completed"
    print(f"[PASS] Emergency Ended Passed. Time Saved: {summary['estimated_time_saved_minutes']} min, Prioritized Signals: {summary['signals_prioritized_count']}")

    # 9. Multi-Ambulance Conflict Detection & Resolution (Section 19, 20, 21, 22, 23, 24)
    conflict_payload = {
        "intersection_id": "INT-CENTRAL-01",
        "intersection_name": "Central Junction (MG Road & Brigade)",
        "ambulances": [
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
    }
    res = requests.post(f"{BASE_URL}/api/conflicts/resolve", json=conflict_payload)
    assert res.status_code == 200
    conf_res = res.json()
    assert conf_res["conflict_detected"] == True
    assert conf_res["granted_ambulance_number"] == "KA-01-EA-1001"
    print(f"[PASS] Conflict Resolution Passed. Winner: {conf_res['granted_ambulance_number']} (Score: {conf_res['priority_breakdowns'][0]['total_priority']}) over Held: {conf_res['held_ambulances'][0]['ambulance_number']}")

    # 10. Manual Traffic Signal Override (Section 29)
    res = requests.get(f"{BASE_URL}/api/signals")
    first_sig = res.json()["signals"][0]
    override_payload = {"action": "EMERGENCY_GREEN", "reason": "Officer Command for Rapid Corridor"}
    res = requests.post(f"{BASE_URL}/api/signals/{first_sig['id']}/override", json=override_payload, headers=admin_headers)
    assert res.status_code == 200
    print(f"[PASS] Manual Signal Override Passed. Signal {first_sig['name']} forced to: {res.json()['signal']['status']}")

    # 11. Audit Logs Check (Section 37)
    res = requests.get(f"{BASE_URL}/api/audit-logs?limit=10")
    assert res.status_code == 200 and len(res.json()["audit_logs"]) > 0
    print(f"[PASS] Audit Logs Passed. Total Recent Entries: {len(res.json()['audit_logs'])}. Latest: {res.json()['audit_logs'][0]['action']}")

    # 12. What-If & Analytics
    res = requests.get(f"{BASE_URL}/api/analytics")
    assert res.status_code == 200
    analytics = res.json()
    print(f"[PASS] Analytics Passed. Total Emergencies: {analytics['metrics']['total_emergencies']}, Time Saved: {analytics['metrics']['average_time_saved_minutes']} min")

    print("\n========================================")
    print("ALL 12 BACKEND & ALGORITHM TESTS PASSED!")
    print("========================================")

if __name__ == "__main__":
    test_api()
