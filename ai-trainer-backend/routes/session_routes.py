from fastapi import APIRouter
from database import db
from datetime import datetime, date, timedelta
from collections import defaultdict

router = APIRouter()
sessions_collection = db["sessions"]


@router.get("/dashboard-stats")
def get_dashboard_stats(username: str = None):
    query = {"username": username} if username else {}
    sessions = list(sessions_collection.find(query, {"_id": 0}).sort("date", -1))

    # ── Helper: build Mon-Sun skeleton for current week ──────────────────
    today  = date.today()
    monday = today - timedelta(days=today.weekday())   # weekday() Mon=0 Sun=6

    def week_skeleton():
        return [
            {"name": (monday + timedelta(days=i)).strftime("%a"), "score": None}
            for i in range(7)
        ]

    if not sessions:
        return {
            "sessions_done":   0,
            "avg_score":       0,
            "streak":          0,
            "improvement":     0,
            "recent_sessions": [],
            "progress_data":   week_skeleton(),
        }

    # ── Overall average score ────────────────────────────────────────────
    scores    = [s.get("overall_score", 0) for s in sessions]
    avg_score = round(sum(scores) / len(scores))

    # ── Streak — consecutive days backwards from today ───────────────────
    day_set = set()
    for s in sessions:
        try:
            day_set.add(datetime.fromisoformat(s["date"]).date())
        except Exception:
            pass

    streak, check = 0, today
    while check in day_set:
        streak += 1
        check -= timedelta(days=1)

    # ── Improvement — last 3 vs previous 3, never shown as negative ──────
    improvement = 0
    if len(scores) >= 6:
        improvement = round(sum(scores[:3]) / 3 - sum(scores[3:6]) / 3)
    elif len(scores) >= 2:
        improvement = round(scores[0] - scores[-1])
    improvement = max(0, improvement)   # clamp — we never show a drop as negative

    # ── Recent 3 sessions ────────────────────────────────────────────────
    recent = []
    for s in sessions[:3]:
        try:
            fmt = datetime.fromisoformat(s["date"]).strftime("%b %d, %Y")
        except Exception:
            fmt = s.get("date", "")[:10]
        recent.append({
            "type":  s.get("type", "Presentation"),
            "date":  fmt,
            "score": s.get("overall_score", 0),
        })

    # ── Current week Mon–Sun progress chart ──────────────────────────────
    day_scores = defaultdict(list)
    for s in sessions:
        try:
            d = datetime.fromisoformat(s["date"]).date()
            day_scores[d].append(s.get("overall_score", 0))
        except Exception:
            pass

    progress_data = []
    for i in range(7):                          # i=0 → Monday, i=6 → Sunday
        d   = monday + timedelta(days=i)
        avg = round(sum(day_scores[d]) / len(day_scores[d])) if day_scores[d] else None
        progress_data.append({"name": d.strftime("%a"), "score": avg})

    return {
        "sessions_done":   len(sessions),
        "avg_score":       avg_score,
        "streak":          streak,
        "improvement":     improvement,
        "recent_sessions": recent,
        "progress_data":   progress_data,
    }