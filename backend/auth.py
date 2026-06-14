import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import users
from models import new_id, now_iso

JWT_SECRET = os.environ.get('JWT_SECRET', 'change_me_secret')
JWT_ALGO = 'HS256'
TOKEN_TTL_HOURS = 24 * 7

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        'sub': user['id'],
        'officer_id': user['officer_id'],
        'name': user['name'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def public_user(u: dict) -> dict:
    return {
        'id': u['id'],
        'officer_id': u['officer_id'],
        'name': u['name'],
        'email': u.get('email'),
        'station': u.get('station'),
        'rank': u.get('rank'),
        'role': u.get('role', 'officer'),
    }


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Session expired. Please log in again.')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid authentication token')
    user = await users.find_one({'id': payload.get('sub')}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail='User no longer exists')
    return user


async def seed_default_officer():
    """Create a default officer account for the Amroha Cyber Crime PS if none exists."""
    existing = await users.find_one({'officer_id': 'amroha001'})
    if existing:
        return
    user = {
        'id': new_id(),
        'officer_id': 'amroha001',
        'name': 'Inspector R. Sharma',
        'email': 'officer@amrohacyber.gov.in',
        'station': 'Amroha Cyber Crime Police Station, UP',
        'rank': 'Investigating Officer',
        'role': 'admin',
        'password_hash': hash_password('cyber@123'),
        'created_at': now_iso(),
    }
    await users.insert_one(user)
