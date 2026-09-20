from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.database import get_audit_logs_col

async def log_audit_event(
    action: str,
    entity: str,
    details: Dict[str, Any],
    user_id: Optional[str] = None,
    user_name: Optional[str] = "System",
    role: Optional[str] = "system",
    entity_id: Optional[str] = None
):
    """
    Persists an immutable audit log entry in MongoDB.
    """
    try:
        col = get_audit_logs_col()
        doc = {
            "user_id": user_id,
            "user_name": user_name or "System",
            "role": role or "system",
            "action": action,
            "entity": entity,
            "entity_id": str(entity_id) if entity_id else None,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await col.insert_one(doc)
    except Exception as e:
        # Non-blocking log error
        print(f"Audit log insertion error: {e}")
