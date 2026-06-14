from fastapi import APIRouter, HTTPException, Depends
from database import users
from models import LoginRequest, RegisterRequest, new_id, now_iso
from auth import (
    hash_password, verify_password, create_token, public_user, get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(req: LoginRequest):
    oid = req.officer_id.strip()
    user = await users.find_one({"officer_id": oid})
    if not user:
        # also allow login by email
        user = await users.find_one({"email": oid.lower()})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid Officer ID or password")
    token = create_token(user)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}


@router.post("/register")
async def register(req: RegisterRequest):
    oid = req.officer_id.strip()
    if await users.find_one({"officer_id": oid}):
        raise HTTPException(status_code=400, detail="Officer ID already registered")
    user = {
        "id": new_id(),
        "officer_id": oid,
        "name": req.name.strip(),
        "email": (req.email or "").lower() or None,
        "station": req.station,
        "rank": req.rank,
        "role": "officer",
        "password_hash": hash_password(req.password),
        "created_at": now_iso(),
    }
    await users.insert_one(user)
    token = create_token(user)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)
