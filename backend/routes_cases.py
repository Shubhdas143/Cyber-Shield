from fastapi import APIRouter, Depends, HTTPException

from database import cases, analyses
from models import CaseCreate, CaseUpdate, new_id, now_iso
from auth import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("")
async def list_cases(user: dict = Depends(get_current_user)):
    items = await cases.find({}, {"_id": 0}).sort("updated_at", -1).to_list(300)
    for c in items:
        c["analysis_count"] = await analyses.count_documents({"case_id": c["id"]})
    return items


@router.post("")
async def create_case(req: CaseCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": new_id(),
        "officer_id": user["id"],
        "officer_name": user["name"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
        **req.model_dump(),
    }
    await cases.insert_one(doc)
    doc.pop("_id", None)
    doc["analysis_count"] = 0
    return doc


@router.get("/{case_id}")
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    case = await cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    linked = await analyses.find({"case_id": case_id}, {"_id": 0, "input": 0}).sort("created_at", -1).to_list(200)
    case["analyses"] = linked
    return case


@router.put("/{case_id}")
async def update_case(case_id: str, req: CaseUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    res = await cases.update_one({"id": case_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return await cases.find_one({"id": case_id}, {"_id": 0})


@router.delete("/{case_id}")
async def delete_case(case_id: str, user: dict = Depends(get_current_user)):
    res = await cases.delete_one({"id": case_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    await analyses.update_many({"case_id": case_id}, {"$set": {"case_id": None}})
    return {"deleted": True}
