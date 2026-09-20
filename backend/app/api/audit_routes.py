from fastapi import APIRouter, Query
from app.database import get_audit_logs_col

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("")
async def get_audit_logs(limit: int = Query(50, le=200)):
    col = get_audit_logs_col()
    cursor = col.find().sort("timestamp", -1).limit(limit)
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        logs.append(doc)
    return {"audit_logs": logs}

