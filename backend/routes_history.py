from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional

from database import analyses
from auth import get_current_user
import pdf_service

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def list_history(
    tool_type: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    user: dict = Depends(get_current_user),
):
    q: dict = {}
    if tool_type:
        q["tool_type"] = tool_type
    if risk:
        q["risk_level"] = risk
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"target": {"$regex": search, "$options": "i"}},
        ]
    projection = {"_id": 0, "input": 0}
    items = await analyses.find(q, projection).sort("created_at", -1).to_list(limit)
    return items


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    item = await analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return item


@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    res = await analyses.delete_one({"id": analysis_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"deleted": True}


@router.get("/{analysis_id}/pdf")
async def download_pdf(analysis_id: str, user: dict = Depends(get_current_user)):
    item = await analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    pdf_bytes = pdf_service.build_pdf(item)
    fname = f"CyberShield_{item.get('tool_type','report')}_{analysis_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
