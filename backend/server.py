from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import client  # noqa: E402
from auth import seed_default_officer  # noqa: E402
import routes_auth, routes_tools, routes_history, routes_cases, routes_stats  # noqa: E402

app = FastAPI(title="Cyber Shield API", version="1.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "Cyber Shield API", "status": "online", "station": "Amroha Cyber Crime Police Station, UP"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


# Mount feature routers under /api
api_router.include_router(routes_auth.router)
api_router.include_router(routes_tools.router)
api_router.include_router(routes_history.router)
api_router.include_router(routes_cases.router)
api_router.include_router(routes_stats.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("cyber_shield")


@app.on_event("startup")
async def on_startup():
    await seed_default_officer()
    logger.info("Cyber Shield API started; default officer seeded.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
