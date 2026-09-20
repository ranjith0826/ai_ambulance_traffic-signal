from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.models.schemas import UserRegister, UserLogin, UserResponse
from app.auth.jwt_handler import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_users_col, get_ambulances_col, get_hospitals_col
from app.services.audit_service import log_audit_event
from app.websocket.sio import emit_notification

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register_user(payload: UserRegister):
    users_col = get_users_col()
    
    # 1. Validation checks
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
        
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    existing_user = await users_col.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Role specific validations
    ambulance_id = None
    hospital_id = None

    if payload.role == "driver":
        if not payload.ambulance_number:
            raise HTTPException(status_code=400, detail="Please enter ambulance number.")
    elif payload.role == "hospital_admin":
        if not payload.hospital_name:
            raise HTTPException(status_code=400, detail="Please enter hospital name.")
    elif payload.role == "traffic_officer":
        if not payload.department:
            raise HTTPException(status_code=400, detail="Please enter department.")

    # 2. Hash password
    pw_hash = hash_password(payload.password)
    now_iso = datetime.now(timezone.utc).isoformat()

    # 3. Create user doc
    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "phone": payload.phone.strip(),
        "password_hash": pw_hash,
        "role": payload.role.value,
        "status": "active",
        "created_at": now_iso,
        "department": payload.department if payload.role == "traffic_officer" else None,
        "officer_id": payload.officer_id if payload.role == "traffic_officer" else None,
        "ambulance_number": payload.ambulance_number if payload.role == "driver" else None,
        "driver_license": payload.driver_license if payload.role == "driver" else None,
        "hospital_name": payload.hospital_name if payload.role == "hospital_admin" else None,
        "hospital_address": payload.hospital_address if payload.role == "hospital_admin" else None,
    }

    result = await users_col.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # 4. Auto-link role-specific entities
    if payload.role == "driver" and payload.ambulance_number:
        amb_col = get_ambulances_col()
        # Find or create ambulance
        amb = await amb_col.find_one({"ambulance_number": payload.ambulance_number.upper()})
        if amb:
            ambulance_id = str(amb["_id"])
            await amb_col.update_one(
                {"_id": amb["_id"]},
                {"$set": {"driver_id": user_id, "driver_name": payload.name}}
            )
        else:
            amb_result = await amb_col.insert_one({
                "ambulance_number": payload.ambulance_number.upper(),
                "driver_id": user_id,
                "driver_name": payload.name,
                "status": "available",
                "current_location": {"latitude": 12.9716, "longitude": 77.5946},
                "heading": 0.0,
                "speed": 0.0,
                "updated_at": now_iso
            })
            ambulance_id = str(amb_result.inserted_id)
        
        await users_col.update_one({"_id": result.inserted_id}, {"$set": {"ambulance_id": ambulance_id}})

    elif payload.role == "hospital_admin" and payload.hospital_name:
        hosp_col = get_hospitals_col()
        hosp_result = await hosp_col.insert_one({
            "name": payload.hospital_name,
            "address": payload.hospital_address or "City Center Road",
            "location": {"latitude": 12.9780, "longitude": 77.5995},
            "phone": payload.phone,
            "emergency_beds": 12,
            "emergency_beds_available": 6,
            "icu_beds": 6,
            "icu_beds_available": 3,
            "ventilators": 4,
            "ventilators_available": 2,
            "specialists": ["Cardiology", "Neurology", "Trauma", "Orthopedics", "Emergency Medicine"],
            "emergency_readiness": 92,
            "created_by": user_id,
            "updated_at": now_iso
        })
        hospital_id = str(hosp_result.inserted_id)
        await users_col.update_one({"_id": result.inserted_id}, {"$set": {"hospital_id": hospital_id}})

    # 5. Audit log
    await log_audit_event(
        action="USER_REGISTERED",
        entity="User",
        entity_id=user_id,
        user_id=user_id,
        user_name=payload.name,
        role=payload.role.value,
        details={"email": payload.email, "role": payload.role.value}
    )

    # 6. Generate token
    token = create_access_token({"sub": user_id, "role": payload.role.value, "name": payload.name})

    user_data = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "role": payload.role.value,
        "department": payload.department,
        "officer_id": payload.officer_id,
        "hospital_id": hospital_id,
        "hospital_name": payload.hospital_name,
        "ambulance_id": ambulance_id,
        "ambulance_number": payload.ambulance_number,
        "driver_license": payload.driver_license,
        "status": "active",
        "created_at": now_iso
    }

    return {
        "message": "Account created successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login")
async def login_user(payload: UserLogin):
    users_col = get_users_col()
    user = await users_col.find_one({"email": payload.email.lower().strip()})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    if user.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="Account is disabled. Please contact your system administrator.")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user.get("role"), "name": user.get("name")})

    await log_audit_event(
        action="USER_LOGIN",
        entity="User",
        entity_id=user_id,
        user_id=user_id,
        user_name=user.get("name"),
        role=user.get("role"),
        details={"email": user.get("email")}
    )

    user_data = {
        "id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone", ""),
        "role": user.get("role"),
        "department": user.get("department"),
        "officer_id": user.get("officer_id"),
        "hospital_id": user.get("hospital_id"),
        "hospital_name": user.get("hospital_name"),
        "ambulance_id": user.get("ambulance_id"),
        "ambulance_number": user.get("ambulance_number"),
        "driver_license": user.get("driver_license"),
        "status": user.get("status", "active"),
        "created_at": user.get("created_at", "")
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

@router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    await log_audit_event(
        action="USER_LOGOUT",
        entity="User",
        entity_id=current_user["id"],
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"email": current_user.get("email")}
    )
    return {"message": "Logged out successfully."}
