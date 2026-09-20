import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

MONGODB_URI = "mongodb://127.0.0.1:27017"
DATABASE_NAME = "lifelane_ai"

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

async def seed_database():
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. System Administrator
    users_col = db["users"]
    existing_admin = await users_col.find_one({"email": "admin@lifelane.ai"})
    if not existing_admin:
        admin_doc = {
            "name": "Bengaluru Smart City Admin",
            "email": "admin@lifelane.ai",
            "phone": "+91 98765 00000",
            "password_hash": hash_pw("Admin@123456"),
            "role": "admin",
            "status": "active",
            "created_at": now_iso
        }
        res_admin = await users_col.insert_one(admin_doc)
        admin_id = str(res_admin.inserted_id)
        print("Created Seed Admin: admin@lifelane.ai / Admin@123456")
    else:
        admin_id = str(existing_admin["_id"])
        print("Seed Admin already exists.")

    # Demo Driver User
    driver_user = await users_col.find_one({"email": "driver@lifelane.ai"})
    if not driver_user:
        d_res = await users_col.insert_one({
            "name": "Rajesh Kumar",
            "email": "driver@lifelane.ai",
            "phone": "+91 98765 11111",
            "password_hash": hash_pw("Driver@123456"),
            "role": "driver",
            "ambulance_number": "KA-01-EA-1001",
            "driver_license": "DL-04-2021-009214",
            "status": "active",
            "created_at": now_iso
        })
        driver_id = str(d_res.inserted_id)
        print("Created Seed Driver: driver@lifelane.ai / Driver@123456")
    else:
        driver_id = str(driver_user["_id"])

    # Demo Traffic Officer User (Bengaluru Traffic Police)
    officer_user = await users_col.find_one({"email": "officer@lifelane.ai"})
    if not officer_user:
        await users_col.insert_one({
            "name": "Vikram Rathore",
            "email": "officer@lifelane.ai",
            "phone": "+91 98765 22222",
            "password_hash": hash_pw("Officer@123456"),
            "role": "traffic_officer",
            "department": "Bengaluru Traffic Police (BTP) - TMC Infantry Road",
            "officer_id": "BTP-BLR-8842",
            "status": "active",
            "created_at": now_iso
        })
        print("Created Seed Traffic Officer: officer@lifelane.ai / Officer@123456")
    else:
        await users_col.update_one(
            {"_id": officer_user["_id"]},
            {"$set": {"department": "Bengaluru Traffic Police (BTP) - TMC Infantry Road"}}
        )

    # Demo Hospital Administrator (Manipal Hospital Bengaluru)
    hosp_admin = await users_col.find_one({"email": "hospital@lifelane.ai"})
    if not hosp_admin:
        await users_col.insert_one({
            "name": "Dr. Ananya Sharma",
            "email": "hospital@lifelane.ai",
            "phone": "+91 98765 33333",
            "password_hash": hash_pw("Hospital@123456"),
            "role": "hospital_admin",
            "hospital_name": "Manipal Hospital (Old Airport Road)",
            "hospital_address": "98 HAL Old Airport Rd, Kodihalli, Bengaluru",
            "status": "active",
            "created_at": now_iso
        })
        print("Created Seed Hospital Admin: hospital@lifelane.ai / Hospital@123456")
    else:
        await users_col.update_one(
            {"_id": hosp_admin["_id"]},
            {"$set": {
                "hospital_name": "Manipal Hospital (Old Airport Road)",
                "hospital_address": "98 HAL Old Airport Rd, Kodihalli, Bengaluru"
            }}
        )

    # 2. Seed Real Bengaluru Hospitals
    hosp_col = db["hospitals"]
    await hosp_col.delete_many({}) # Refresh with authentic Bangalore hospitals

    hospitals_seed = [
        {
            "name": "Manipal Hospital (Old Airport Road)",
            "address": "98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
            "location": {"latitude": 12.9592, "longitude": 77.6499},
            "phone": "+91 80 2502 4444",
            "emergency_beds": 35,
            "emergency_beds_available": 14,
            "icu_beds": 20,
            "icu_beds_available": 8,
            "ventilators": 16,
            "ventilators_available": 7,
            "specialists": ["Cardiology", "Neurology", "Trauma", "Orthopedics", "Emergency Medicine"],
            "emergency_readiness": 98,
            "incoming_patients_count": 1,
            "updated_at": now_iso
        },
        {
            "name": "Apollo Hospital (Bannerghatta Road)",
            "address": "154/11 Bannerghatta Main Rd, Opp IIMB, Bengaluru, Karnataka 560076",
            "location": {"latitude": 12.8943, "longitude": 77.5986},
            "phone": "+91 80 2630 4050",
            "emergency_beds": 30,
            "emergency_beds_available": 12,
            "icu_beds": 18,
            "icu_beds_available": 6,
            "ventilators": 12,
            "ventilators_available": 5,
            "specialists": ["Cardiology", "Cardiothoracic Surgery", "Trauma", "Pediatrics", "Intensive Care"],
            "emergency_readiness": 96,
            "incoming_patients_count": 2,
            "updated_at": now_iso
        },
        {
            "name": "Fortis Hospital (Cunningham Road)",
            "address": "14 Cunningham Rd, Vasanth Nagar, Bengaluru, Karnataka 560052",
            "location": {"latitude": 12.9904, "longitude": 77.5937},
            "phone": "+91 80 4199 4444",
            "emergency_beds": 22,
            "emergency_beds_available": 9,
            "icu_beds": 12,
            "icu_beds_available": 5,
            "ventilators": 8,
            "ventilators_available": 4,
            "specialists": ["Cardiology", "Interventional Radiology", "Trauma", "Emergency Medicine"],
            "emergency_readiness": 94,
            "incoming_patients_count": 0,
            "updated_at": now_iso
        },
        {
            "name": "Aster CMI Hospital (Hebbal)",
            "address": "No. 43/42 NH 44, Outer Ring Rd, Hebbal, Bengaluru, Karnataka 560092",
            "location": {"latitude": 13.0562, "longitude": 77.5925},
            "phone": "+91 80 4342 0100",
            "emergency_beds": 28,
            "emergency_beds_available": 11,
            "icu_beds": 16,
            "icu_beds_available": 7,
            "ventilators": 10,
            "ventilators_available": 5,
            "specialists": ["Neurology", "Neurosurgery", "Trauma", "Emergency Medicine", "Intensive Care"],
            "emergency_readiness": 95,
            "incoming_patients_count": 1,
            "updated_at": now_iso
        },
        {
            "name": "St. John's Medical College Hospital (Koramangala)",
            "address": "Sarjapur - Marathahalli Rd, John Nagar, Koramangala 2nd Block, Bengaluru 560034",
            "location": {"latitude": 12.9304, "longitude": 77.6200},
            "phone": "+91 80 2206 5000",
            "emergency_beds": 40,
            "emergency_beds_available": 18,
            "icu_beds": 24,
            "icu_beds_available": 9,
            "ventilators": 18,
            "ventilators_available": 8,
            "specialists": ["General Medicine", "Trauma", "Cardiology", "Pediatrics", "Burn Care"],
            "emergency_readiness": 97,
            "incoming_patients_count": 2,
            "updated_at": now_iso
        },
        {
            "name": "Narayana Institute of Cardiac Sciences (Health City)",
            "address": "258/A Bommasandra Industrial Area, Anekal Taluk, Bengaluru 560099",
            "location": {"latitude": 12.8123, "longitude": 77.6933},
            "phone": "+91 80 7122 2222",
            "emergency_beds": 50,
            "emergency_beds_available": 25,
            "icu_beds": 35,
            "icu_beds_available": 14,
            "ventilators": 25,
            "ventilators_available": 11,
            "specialists": ["Cardiac Surgery", "Cardiology", "Electrophysiology", "Heart Transplant", "Trauma"],
            "emergency_readiness": 99,
            "incoming_patients_count": 1,
            "updated_at": now_iso
        },
        {
            "name": "Bowring and Lady Curzon Hospital (Shivajinagar)",
            "address": "Lady Curzon Rd, Shivaji Nagar, Bengaluru, Karnataka 560001",
            "location": {"latitude": 12.9830, "longitude": 77.6037},
            "phone": "+91 80 2559 1362",
            "emergency_beds": 25,
            "emergency_beds_available": 10,
            "icu_beds": 14,
            "icu_beds_available": 4,
            "ventilators": 8,
            "ventilators_available": 3,
            "specialists": ["Emergency Medicine", "General Surgery", "Trauma", "Orthopedics"],
            "emergency_readiness": 90,
            "incoming_patients_count": 0,
            "updated_at": now_iso
        },
        {
            "name": "Victoria Hospital (BMCRI - KR Market)",
            "address": "Fort Rd, Near City Market (KR Market), Kalasipalya, Bengaluru 560002",
            "location": {"latitude": 12.9628, "longitude": 77.5746},
            "phone": "+91 80 2670 1150",
            "emergency_beds": 45,
            "emergency_beds_available": 16,
            "icu_beds": 20,
            "icu_beds_available": 6,
            "ventilators": 15,
            "ventilators_available": 6,
            "specialists": ["Trauma", "Burn & Plastic Surgery", "Orthopedics", "Emergency Medicine"],
            "emergency_readiness": 93,
            "incoming_patients_count": 1,
            "updated_at": now_iso
        }
    ]
    await hosp_col.insert_many(hospitals_seed)
    print("Seeded 8 authentic Bengaluru Hospitals.")

    # 3. Seed Real Bengaluru Traffic Signal Junctions
    sig_col = db["signals"]
    await sig_col.delete_many({}) # Refresh with authentic Bangalore junctions

    signals_seed = [
        {"name": "Sony World Signal (Koramangala 80ft Rd)", "intersection_id": "INT-BLR-SONY-01", "location": {"latitude": 12.9352, "longitude": 77.6245}},
        {"name": "Silk Board Junction (Hosur Rd & ORR)", "intersection_id": "INT-BLR-SILK-02", "location": {"latitude": 12.9172, "longitude": 77.6228}},
        {"name": "Trinity Circle (MG Road & Old Airport Rd)", "intersection_id": "INT-BLR-TRINITY-03", "location": {"latitude": 12.9729, "longitude": 77.6190}},
        {"name": "Anil Kumble Circle (MG Road & Brigade Rd)", "intersection_id": "INT-BLR-KUMBLE-04", "location": {"latitude": 12.9754, "longitude": 77.6066}},
        {"name": "Domlur Flyover Junction (Inner Ring Rd)", "intersection_id": "INT-BLR-DOMLUR-05", "location": {"latitude": 12.9609, "longitude": 77.6387}},
        {"name": "Indiranagar 100ft Rd & 12th Main Crossing", "intersection_id": "INT-BLR-INDIRA-06", "location": {"latitude": 12.9698, "longitude": 77.6416}},
        {"name": "Richmond Circle (Residency Road)", "intersection_id": "INT-BLR-RICHMOND-07", "location": {"latitude": 12.9664, "longitude": 77.5960}},
        {"name": "Mekhri Circle (Bellary Rd & CV Raman Rd)", "intersection_id": "INT-BLR-MEKHRI-08", "location": {"latitude": 13.0076, "longitude": 77.5855}},
        {"name": "Dairy Circle (Bannerghatta Road)", "intersection_id": "INT-BLR-DAIRY-09", "location": {"latitude": 12.9360, "longitude": 77.6000}},
        {"name": "Majestic KSRTC Junction (Subhash Nagar)", "intersection_id": "INT-BLR-MAJESTIC-10", "location": {"latitude": 12.9767, "longitude": 77.5713}},
        {"name": "Hebbal Flyover Junction (Bellary Rd & ORR)", "intersection_id": "INT-BLR-HEBBAL-11", "location": {"latitude": 13.0358, "longitude": 77.5970}},
        {"name": "Marathahalli Bridge Junction (ORR & HAL)", "intersection_id": "INT-BLR-MARATH-12", "location": {"latitude": 12.9569, "longitude": 77.7011}}
    ]

    for sig in signals_seed:
        sig["status"] = "GREEN"
        sig["emergency_corridor_active"] = False
        sig["approaching_ambulance_id"] = None
        sig["approaching_ambulance_number"] = None
        sig["distance_to_signal"] = None
        sig["eta_seconds"] = None
        sig["cycle_time_seconds"] = 60
        sig["updated_at"] = now_iso
        await sig_col.insert_one(sig)
    print("Seeded 12 authentic Bengaluru Traffic Signals.")

    # 4. Seed Ambulances
    amb_col = db["ambulances"]
    await amb_col.delete_many({}) # Refresh ambulances

    ambulances_seed = [
        {"ambulance_number": "KA-01-EA-1001", "driver_id": driver_id, "driver_name": "Rajesh Kumar", "status": "available", "current_location": {"latitude": 12.9719, "longitude": 77.6412}, "heading": 90.0, "speed": 0.0, "base_station": "Indiranagar Hub"},
        {"ambulance_number": "KA-02-EA-1002", "driver_id": None, "driver_name": "Deepak Verma", "status": "available", "current_location": {"latitude": 12.9352, "longitude": 77.6245}, "heading": 45.0, "speed": 0.0, "base_station": "Koramangala Station"},
        {"ambulance_number": "KA-03-EA-1003", "driver_id": None, "driver_name": "Farhan Khan", "status": "available", "current_location": {"latitude": 12.9729, "longitude": 77.6190}, "heading": 180.0, "speed": 0.0, "base_station": "MG Road / Trinity"},
        {"ambulance_number": "KA-04-MB-2045", "driver_id": None, "driver_name": "Suresh Patel", "status": "available", "current_location": {"latitude": 12.9172, "longitude": 77.6228}, "heading": 270.0, "speed": 0.0, "base_station": "Silk Board Junction"},
        {"ambulance_number": "KA-05-EM-9999", "driver_id": None, "driver_name": "Amit Sen", "status": "available", "current_location": {"latitude": 12.9767, "longitude": 77.5713}, "heading": 0.0, "speed": 0.0, "base_station": "Majestic Transit Terminal"},
        {"ambulance_number": "KA-06-BL-7700", "driver_id": None, "driver_name": "Pradeep Gowda", "status": "available", "current_location": {"latitude": 13.0358, "longitude": 77.5970}, "heading": 120.0, "speed": 0.0, "base_station": "Hebbal Rapid Unit"}
    ]

    for amb in ambulances_seed:
        amb["updated_at"] = now_iso
        await amb_col.insert_one(amb)
    print("Seeded 6 authentic Bengaluru Ambulances.")

    # 5. Seed Historical Completed Trips
    trips_col = db["trips"]
    await trips_col.delete_many({}) # Refresh completed trips

    sample_trips = [
        {
            "ambulance_id": "seed-amb-1",
            "ambulance_number": "KA-01-EA-1001",
            "driver_id": driver_id,
            "driver_name": "Rajesh Kumar",
            "hospital_name": "Manipal Hospital (Old Airport Road)",
            "emergency_type": "Cardiac",
            "severity": "Critical",
            "status": "completed",
            "priority_score": 96.4,
            "source": {"latitude": 12.9719, "longitude": 77.6412},
            "destination": {"latitude": 12.9592, "longitude": 77.6499},
            "current_location": {"latitude": 12.9592, "longitude": 77.6499},
            "speed_kmh": 64.0,
            "eta_minutes": 0.0,
            "distance_remaining_km": 0.0,
            "total_distance_km": 4.2,
            "travel_time_seconds": 490,
            "estimated_time_saved_minutes": 14.2,
            "signals_prioritized_count": 4,
            "conflicts_resolved_count": 1,
            "route_coordinates": [[12.9719, 77.6412], [12.9650, 77.6440], [12.9592, 77.6499]],
            "started_at": "2026-09-20T08:15:00Z",
            "ended_at": "2026-09-20T08:23:10Z"
        },
        {
            "ambulance_id": "seed-amb-2",
            "ambulance_number": "KA-02-EA-1002",
            "driver_id": driver_id,
            "driver_name": "Deepak Verma",
            "hospital_name": "St. John's Medical College Hospital (Koramangala)",
            "emergency_type": "Trauma",
            "severity": "Critical",
            "status": "completed",
            "priority_score": 89.2,
            "source": {"latitude": 12.9172, "longitude": 77.6228},
            "destination": {"latitude": 12.9304, "longitude": 77.6200},
            "current_location": {"latitude": 12.9304, "longitude": 77.6200},
            "speed_kmh": 58.0,
            "eta_minutes": 0.0,
            "distance_remaining_km": 0.0,
            "total_distance_km": 3.6,
            "travel_time_seconds": 410,
            "estimated_time_saved_minutes": 12.5,
            "signals_prioritized_count": 3,
            "conflicts_resolved_count": 1,
            "route_coordinates": [[12.9172, 77.6228], [12.9240, 77.6210], [12.9304, 77.6200]],
            "started_at": "2026-09-20T09:30:00Z",
            "ended_at": "2026-09-20T09:36:50Z"
        }
    ]
    await trips_col.insert_many(sample_trips)
    print("Seeded Bengaluru trip records.")

    # 6. Seed Conflicts
    conflicts_col = db["conflicts"]
    await conflicts_col.delete_many({})
    await conflicts_col.insert_one({
        "intersection_id": "INT-BLR-SONY-01",
        "intersection_name": "Sony World Signal (Koramangala)",
        "ambulance_a": {
            "ambulance_number": "KA-01-EA-1001",
            "direction": "North-South (100ft Rd)",
            "severity": "Critical",
            "eta_seconds": 14,
            "distance_meters": 180,
            "priority_score": 94.2
        },
        "ambulance_b": {
            "ambulance_number": "KA-04-MB-2045",
            "direction": "East-West (80ft Rd)",
            "severity": "High",
            "eta_seconds": 19,
            "distance_meters": 240,
            "priority_score": 78.6
        },
        "winner_ambulance_number": "KA-01-EA-1001",
        "status": "resolved",
        "resolution_action": "GREEN_TO_AMB_A_HOLD_AMB_B",
        "delay_to_loser_seconds": 12,
        "created_at": now_iso
    })

    print("Seed complete. LifeLane AI database initialized with real Bengaluru data!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
