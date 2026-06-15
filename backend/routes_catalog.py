from fastapi import APIRouter, Depends

from auth import get_current_user
import catalog

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/tools")
async def list_catalog_tools(user: dict = Depends(get_current_user)):
    return catalog.get_catalog()
