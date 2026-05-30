from fastapi import APIRouter
from database import db
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()
notifications_col = db["notifications"]


# ── Helper: _id → str ────────────────────────────────────────────────────────
def fmt(n: dict) -> dict:
    n["id"] = str(n.pop("_id"))
    return n


# ── Relative time helper ─────────────────────────────────────────────────────
def relative_time(iso: str) -> str:
    try:
        dt  = datetime.fromisoformat(iso).replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = int((now - dt).total_seconds())
        if diff < 60:             return "Just now"
        if diff < 3600:           return f"{diff // 60} min ago"
        if diff < 86400:          return f"{diff // 3600} hour{'s' if diff//3600>1 else ''} ago"
        if diff < 172800:         return "Yesterday"
        if diff < 604800:         return f"{diff // 86400} days ago"
        return dt.strftime("%b %d, %Y")
    except Exception:
        return ""


# ════════════════════════════════════════════════════════
# GET  /notifications?username=...
# ════════════════════════════════════════════════════════
@router.get("/notifications")
def get_notifications(username: str = "anonymous"):
    docs = list(
        notifications_col.find({"username": username}, sort=[("date", -1)])
    )
    result = []
    for n in docs:
        n = fmt(n)
        n["time"] = relative_time(n.get("date", ""))
        result.append(n)
    return result


# ════════════════════════════════════════════════════════
# PATCH  /notifications/{id}/read
# ════════════════════════════════════════════════════════
@router.patch("/notifications/{notif_id}/read")
def mark_read(notif_id: str):
    notifications_col.update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}}
    )
    return {"ok": True}


# ════════════════════════════════════════════════════════
# PATCH  /notifications/read-all?username=...
# ════════════════════════════════════════════════════════
@router.patch("/notifications/read-all")
def mark_all_read(username: str = "anonymous"):
    notifications_col.update_many(
        {"username": username},
        {"$set": {"read": True}}
    )
    return {"ok": True}


# ════════════════════════════════════════════════════════
# DELETE  /notifications/{id}
# ════════════════════════════════════════════════════════
@router.delete("/notifications/{notif_id}")
def delete_one(notif_id: str):
    notifications_col.delete_one({"_id": ObjectId(notif_id)})
    return {"ok": True}


# ════════════════════════════════════════════════════════
# DELETE  /notifications/clear-all?username=...
# ════════════════════════════════════════════════════════
@router.delete("/notifications/clear-all")
def clear_all(username: str = "anonymous"):
    notifications_col.delete_many({"username": username})
    return {"ok": True}