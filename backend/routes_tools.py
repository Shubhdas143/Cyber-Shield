import hashlib
from urllib.parse import urlparse
import re

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional

from database import analyses, cases
from models import (
    IPIntelRequest, URLScanRequest, EmailForensicsRequest, HashCompareRequest,
    CaseReportRequest, new_id, now_iso,
)
from auth import get_current_user
import llm_service
import geo_service

router = APIRouter(prefix="/tools", tags=["tools"])

IP_RE = re.compile(r"^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$")


async def save_analysis(doc: dict, user: dict, case_id: Optional[str]) -> dict:
    record = {
        "id": new_id(),
        "officer_id": user["id"],
        "officer_name": user["name"],
        "case_id": case_id or None,
        "created_at": now_iso(),
        **doc,
    }
    await analyses.insert_one(record)
    if case_id:
        await cases.update_one({"id": case_id}, {"$set": {"updated_at": now_iso()}})
    record.pop("_id", None)
    return record


@router.post("/ip-intel")
async def ip_intel(req: IPIntelRequest, user: dict = Depends(get_current_user)):
    ip = req.ip.strip()
    if not ip or not IP_RE.match(ip):
        raise HTTPException(status_code=400, detail="Please enter a valid IPv4 or IPv6 address")
    geo = await geo_service.geolocate_ip(ip)
    risk, markdown = await llm_service.analyze_ip(ip, geo)
    return await save_analysis({
        "tool_type": "ip-intel",
        "title": f"IP Intelligence — {ip}",
        "target": ip,
        "input": {"ip": ip},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"geo": geo},
    }, user, req.case_id)


@router.post("/url-scan")
async def url_scan(req: URLScanRequest, user: dict = Depends(get_current_user)):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Please enter a URL")
    full = url if url.startswith(("http://", "https://")) else f"https://{url}"
    try:
        u = urlparse(full)
        parsed = (f"Protocol: {u.scheme} | Host: {u.hostname} | Path: {u.path or '/'} | "
                  f"Query: {u.query or 'none'} | Port: {u.port or 'default'}")
        host = u.hostname or url
    except Exception:
        parsed = "Could not parse URL"
        host = url
    risk, markdown = await llm_service.analyze_url(url, parsed)
    return await save_analysis({
        "tool_type": "url-scan",
        "title": f"URL Scan — {host}",
        "target": url,
        "input": {"url": url},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"host": host},
    }, user, req.case_id)


@router.post("/email-forensics")
async def email_forensics(req: EmailForensicsRequest, user: dict = Depends(get_current_user)):
    headers = req.headers.strip()
    if len(headers) < 10:
        raise HTTPException(status_code=400, detail="Please paste the raw email headers")
    sender = ""
    subj = ""
    m = re.search(r"^From:\s*(.+)$", headers, re.IGNORECASE | re.MULTILINE)
    if m:
        sender = m.group(1).strip()[:80]
    s = re.search(r"^Subject:\s*(.+)$", headers, re.IGNORECASE | re.MULTILINE)
    if s:
        subj = s.group(1).strip()[:80]
    risk, markdown = await llm_service.analyze_email(headers)
    return await save_analysis({
        "tool_type": "email-forensics",
        "title": f"Email Forensics — {sender or subj or 'Header analysis'}",
        "target": sender or subj or "Email headers",
        "input": {"headers": headers},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"sender": sender, "subject": subj},
    }, user, req.case_id)


@router.post("/hash-file")
async def hash_file(
    file: UploadFile = File(...),
    expected: Optional[str] = Form(None),
    case_id: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    hashers = {
        "MD5": hashlib.md5(), "SHA-1": hashlib.sha1(),
        "SHA-256": hashlib.sha256(), "SHA-512": hashlib.sha512(),
    }
    size = 0
    while True:
        chunk = await file.read(1024 * 256)
        if not chunk:
            break
        size += len(chunk)
        for h in hashers.values():
            h.update(chunk)
    digests = {k: v.hexdigest() for k, v in hashers.items()}

    match = None
    matched_algo = None
    exp = (expected or "").strip().lower()
    if exp:
        for algo, dg in digests.items():
            if dg.lower() == exp:
                match = True
                matched_algo = algo
                break
        if match is None:
            match = False

    ctx = (f"File: {file.filename} | Size: {size/1024:.2f} KB\n"
           f"MD5: {digests['MD5']}\nSHA-1: {digests['SHA-1']}\n"
           f"SHA-256: {digests['SHA-256']}\nSHA-512: {digests['SHA-512']}")
    if exp:
        ctx += (f"\nExpected hash provided: {exp}\n"
                f"Match result: {'MATCH (' + matched_algo + ')' if match else 'NO MATCH — possible tampering'}")
    markdown = await llm_service.analyze_hashes(ctx)

    risk = None
    if match is True:
        risk = "clean"
    elif match is False:
        risk = "high"
    return await save_analysis({
        "tool_type": "hash-verify",
        "title": f"Hash Verify — {file.filename}",
        "target": file.filename,
        "input": {"filename": file.filename, "size_kb": round(size / 1024, 2), "expected": exp or None},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"digests": digests, "match": match, "matched_algo": matched_algo, "mode": "file"},
    }, user, case_id)


@router.post("/hash-compare")
async def hash_compare(req: HashCompareRequest, user: dict = Depends(get_current_user)):
    h1 = req.hash1.strip()
    h2 = req.hash2.strip()
    if not h1 or not h2:
        raise HTTPException(status_code=400, detail="Please provide both hashes to compare")
    match = h1.lower() == h2.lower()
    length = len(h1)
    inferred = {32: "MD5", 40: "SHA-1", 64: "SHA-256", 128: "SHA-512"}.get(length, "Unknown")
    ctx = (f"Hash 1: {h1}\nHash 2: {h2}\n"
           f"Result: {'IDENTICAL' if match else 'MISMATCH'}\nInferred algorithm: {inferred}")
    markdown = await llm_service.analyze_hashes(ctx)
    return await save_analysis({
        "tool_type": "hash-verify",
        "title": f"Hash Compare — {inferred}",
        "target": f"{inferred} comparison",
        "input": {"hash1": h1, "hash2": h2},
        "result_markdown": markdown,
        "risk_level": "clean" if match else "high",
        "meta": {"match": match, "inferred_algo": inferred, "mode": "compare"},
    }, user, req.case_id)


@router.post("/case-report")
async def case_report(req: CaseReportRequest, user: dict = Depends(get_current_user)):
    if not req.crime_type.strip() or not req.summary.strip():
        raise HTTPException(status_code=400, detail="Crime type and incident summary are required")
    markdown = await llm_service.generate_case_report(req.model_dump())
    return await save_analysis({
        "tool_type": "case-report",
        "title": f"Case Report — {req.crime_type}" + (f" ({req.case_no})" if req.case_no else ""),
        "target": req.crime_type,
        "input": req.model_dump(),
        "result_markdown": markdown,
        "risk_level": None,
        "meta": {"case_no": req.case_no, "victim": req.victim, "platform": req.platform},
    }, user, req.case_id)
