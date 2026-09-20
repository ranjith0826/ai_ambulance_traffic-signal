from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.auth.dependencies import get_current_user, require_role
from app.database import get_users_col
from app.models.schemas import UserStatusUpdate
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("")
async def list_users(current_user: dict = Depends(require_role(["admin"]))):
    col = get_users_col()
    cursor = col.find().sort("created_at", -1)
    users = []
    async for u in cursor:
        users.append({
            "id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "phone": u.get("phone"),
            "role": u.get("role"),
            "department": u.get("department"),
            "officer_id": u.get("officer_id"),
            "hospital_id": u.get("hospital_id"),
            "hospital_name": u.get("hospital_name"),
            "ambulance_id": u.get("ambulance_id"),
            "ambulance_number": u.get("ambulance_number"),
            "driver_license": u.get("driver_license"),
            "status": u.get("status", "active"),
            "created_at": u.get("created_at")
        })
    return {"users": users}

@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    col = get_users_col()
    try:
        query = {"_id": ObjectId(user_id)}
    except Exception:
        query = {"_id": user_id}

    target_user = await col.find_one(query)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.get("role") == "admin" and payload.status == "disabled":
        raise HTTPException(status_code=400, detail="Cannot disable primary administrator account.")

    await col.update_one(query, {"$set": {"status": payload.status}})

    await log_audit_event(
        action=f"USER_STATUS_{payload.status.upper()}",
        entity="User",
        entity_id=user_id,
        user_id=current_user["id"],
        user_name=current_user.get("name"),
        role=current_user.get("role"),
        details={"target_email": target_user.get("email"), "new_status": payload.status}
    )

    return {"message": f"User status updated to {payload.status}.", "user_id": user_id, "status": payload.status}
