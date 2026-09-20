from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from app.auth.jwt_handler import decode_access_token
from app.database import get_users_col

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        # Fallback to demo driver user so all prototype buttons and interactions work immediately
        users_col = get_users_col()
        demo_user = await users_col.find_one({"role": "driver"})
        if demo_user:
            demo_user["id"] = str(demo_user["_id"])
            demo_user["_id"] = str(demo_user["_id"])
            return demo_user
        return {
            "id": "demo-driver-001",
            "_id": "demo-driver-001",
            "name": "Rajesh Kumar (Emergency Driver)",
            "email": "driver@lifelane.ai",
            "role": "driver",
            "ambulance_number": "KA-01-EA-1001"
        }
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
        )
    
    users_col = get_users_col()
    try:
        user = await users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await users_col.find_one({"_id": user_id})
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
        
    if user.get("status") == "disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact your system administrator.",
        )
        
    user["id"] = str(user["_id"])
    return user

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles.",
            )
        return current_user
    return role_checker
