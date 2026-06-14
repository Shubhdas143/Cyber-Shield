from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from database import analyses, cases
from auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def get_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    total = await analyses.count_documents({})
    today_scans = await analyses.count_documents({"created_at": {"$regex": f"^{today}"}})
    high_critical = await analyses.count_documents({"risk_level": {"$in": ["high", "critical"]}})
    total_cases = await cases.count_documents({})

    recent = await analyses.find({}, {"_id": 0, "input": 0}).sort("created_at", -1).to_list(10)

    breakdown = {}
    for t in ["ip-intel", "url-scan", "email-forensics", "hash-verify", "case-report"]:
        breakdown[t] = await analyses.count_documents({"tool_type": t})

    return {
        "total_analyses": total,
        "today_scans": today_scans,
        "high_critical": high_critical,
        "total_cases": total_cases,
        "recent_activity": recent,
        "tool_breakdown": breakdown,
    }
