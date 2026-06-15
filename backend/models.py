from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime, timezone
import uuid


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------- Auth ----------------
class LoginRequest(BaseModel):
    officer_id: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    officer_id: str
    password: str
    email: Optional[str] = None
    station: str = "Amroha Cyber Crime Police Station, UP"
    rank: Optional[str] = "Investigating Officer"


# ---------------- Tools ----------------
class IPIntelRequest(BaseModel):
    ip: str
    case_id: Optional[str] = None


class URLScanRequest(BaseModel):
    url: str
    case_id: Optional[str] = None


class EmailForensicsRequest(BaseModel):
    headers: str
    case_id: Optional[str] = None


class HashCompareRequest(BaseModel):
    hash1: str
    hash2: str
    case_id: Optional[str] = None


class PortScanRequest(BaseModel):
    target: str
    mode: str = "common"  # "common" | "common_range"
    start_port: Optional[int] = None
    end_port: Optional[int] = None
    case_id: Optional[str] = None


class IPv6ConvertRequest(BaseModel):
    ip: str
    case_id: Optional[str] = None


class BreachCheckRequest(BaseModel):
    password: str
    case_id: Optional[str] = None


class DarkWebRequest(BaseModel):
    identifier: str
    case_id: Optional[str] = None


class SSLRequest(BaseModel):
    host: str
    case_id: Optional[str] = None


class IMEIRequest(BaseModel):
    imei: str
    case_id: Optional[str] = None


class DNSReconRequest(BaseModel):
    domain: str
    case_id: Optional[str] = None


class CaseReportRequest(BaseModel):
    case_no: Optional[str] = ""
    date: Optional[str] = ""
    station: Optional[str] = "Amroha Cyber Crime Police Station, UP"
    victim: Optional[str] = ""
    crime_type: str
    platform: Optional[str] = ""
    summary: str
    suspect: Optional[str] = ""
    evidence: Optional[str] = ""
    case_id: Optional[str] = None


# ---------------- Cases ----------------
class CaseCreate(BaseModel):
    title: str
    case_no: Optional[str] = ""
    complainant: Optional[str] = ""
    crime_type: Optional[str] = ""
    platform: Optional[str] = ""
    summary: Optional[str] = ""
    status: str = "Open"


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    case_no: Optional[str] = None
    complainant: Optional[str] = None
    crime_type: Optional[str] = None
    platform: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
