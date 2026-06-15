import hashlib
import socket
import ssl
import ipaddress
from urllib.parse import urlparse
import re

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional

from database import analyses, cases
from models import (
    IPIntelRequest, URLScanRequest, EmailForensicsRequest, HashCompareRequest,
    CaseReportRequest, PortScanRequest, IPv6ConvertRequest, BreachCheckRequest,
    DarkWebRequest, SSLRequest, IMEIRequest, DNSReconRequest,
    new_id, now_iso,
)
from auth import get_current_user
import llm_service
import geo_service
import scan_service
import convert_service
import breach_service
import exif_service
import ssl_service
import imei_service
import dns_service

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


@router.post("/port-scan")
async def port_scan(req: PortScanRequest, user: dict = Depends(get_current_user)):
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Please enter a target host or IP address")
    # strip scheme if a URL was pasted
    if "://" in target:
        target = urlparse(target).hostname or target
    mode = req.mode if req.mode in ("common", "common_range") else "common"
    try:
        ports, note = scan_service.build_port_list(mode, req.start_port, req.end_port)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        scan = await scan_service.scan_ports(target, ports)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Hostname could not be resolved")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scan failed: {e}")

    risk, markdown = await llm_service.analyze_ports(
        target, scan["ip"], scan["open_ports"], scan["scanned"]
    )
    open_list = ", ".join(str(p["port"]) for p in scan["open_ports"]) or "none"
    return await save_analysis({
        "tool_type": "port-scan",
        "title": f"Port Scan — {target}",
        "target": f"{target} ({scan['ip']})",
        "input": {"target": target, "mode": mode, "start_port": req.start_port, "end_port": req.end_port},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {
            "ip": scan["ip"],
            "open_ports": scan["open_ports"],
            "open_summary": open_list,
            "scanned": scan["scanned"],
            "closed_count": scan["closed_count"],
            "mode": mode,
            "note": note,
        },
    }, user, req.case_id)


@router.post("/ipv6-convert")
async def ipv6_convert(req: IPv6ConvertRequest, user: dict = Depends(get_current_user)):
    ip = req.ip.strip()
    try:
        ipaddress.IPv4Address(ip)
    except Exception:
        raise HTTPException(status_code=400, detail="Please enter a valid IPv4 address (e.g. 103.21.58.10)")
    conv = convert_service.ipv4_to_ipv6(ip)
    markdown = convert_service.build_markdown(conv)
    return await save_analysis({
        "tool_type": "ipv6-convert",
        "title": f"IPv4 → IPv6 — {ip}",
        "target": ip,
        "input": {"ip": ip},
        "result_markdown": markdown,
        "risk_level": None,
        "meta": {"conversions": conv},
    }, user, req.case_id)


@router.post("/breach-check")
async def breach_check(req: BreachCheckRequest, user: dict = Depends(get_current_user)):
    password = req.password or ""
    if len(password) < 1:
        raise HTTPException(status_code=400, detail="Please enter a password to check")
    try:
        result = await breach_service.check_password(password)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Breach lookup failed: {e}")

    strength = breach_service.strength_hint(password)
    markdown = await llm_service.analyze_breach(result["found"], result["count"], strength["label"])

    if result["count"] >= 100000:
        risk = "critical"
    elif result["count"] >= 1000:
        risk = "high"
    elif result["count"] > 0:
        risk = "medium"
    else:
        risk = "clean"

    # IMPORTANT: never persist the plaintext password — store only metadata.
    return await save_analysis({
        "tool_type": "breach-verify",
        "title": "Password Breach Check",
        "target": f"Password ({strength['length']} chars · {strength['label']})",
        "input": {"length": strength["length"], "note": "plaintext not stored"},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {
            "found": result["found"],
            "count": result["count"],
            "strength": strength["label"],
            "char_classes": strength["char_classes"],
        },
    }, user, req.case_id)



@router.post("/exif-forensics")
async def exif_forensics(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 25 MB)")
    try:
        meta = exif_service.extract_exif(data, file.filename or "image")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read this file as an image")

    has_gps = bool(meta.get("coords"))
    ctx = exif_service.build_context(meta)
    markdown = await llm_service.analyze_exif(ctx, has_gps)

    return await save_analysis({
        "tool_type": "exif-forensics",
        "title": f"EXIF Forensics — {file.filename}",
        "target": file.filename or "image",
        "input": {"filename": file.filename, "size_kb": round(len(data) / 1024, 2)},
        "result_markdown": markdown,
        "risk_level": None,
        "meta": meta,
    }, user, case_id)


@router.post("/dark-web")
async def dark_web(req: DarkWebRequest, user: dict = Depends(get_current_user)):
    ident = req.identifier.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Please enter an email address or domain")
    kind = "email" if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", ident) else "domain"
    risk, markdown = await llm_service.analyze_darkweb(ident, kind)
    return await save_analysis({
        "tool_type": "dark-web",
        "title": f"Dark Web Exposure — {ident}",
        "target": ident,
        "input": {"identifier": ident, "kind": kind},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"kind": kind, "advisory": True},
    }, user, req.case_id)


@router.post("/ssl-inspect")
async def ssl_inspect(req: SSLRequest, user: dict = Depends(get_current_user)):
    host = req.host.strip()
    if not host:
        raise HTTPException(status_code=400, detail="Please enter a host / domain")
    if "://" in host:
        host = urlparse(host).hostname or host
    host = host.split("/")[0].split(":")[0]
    try:
        cert = await ssl_service.inspect(host, 443)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Hostname could not be resolved")
    except (ssl.SSLError, ConnectionError, OSError, TimeoutError) as e:
        raise HTTPException(status_code=502, detail=f"Could not establish a TLS connection: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Certificate inspection failed: {e}")

    ctx = ssl_service.build_context(cert)
    risk, markdown = await llm_service.analyze_ssl(ctx)
    if cert.get("is_expired") or cert.get("self_signed") or cert.get("not_yet_valid"):
        if risk in (None, "clean", "low"):
            risk = "high"
    return await save_analysis({
        "tool_type": "ssl-inspect",
        "title": f"SSL/TLS Inspection — {host}",
        "target": host,
        "input": {"host": host},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": {"certificate": cert},
    }, user, req.case_id)


@router.post("/imei-track")
async def imei_track(req: IMEIRequest, user: dict = Depends(get_current_user)):
    try:
        parsed = imei_service.parse_imei(req.imei)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    ctx = imei_service.build_context(parsed)
    markdown = await llm_service.analyze_imei(ctx)
    return await save_analysis({
        "tool_type": "imei-track",
        "title": f"IMEI Analysis — {parsed['imei']}",
        "target": parsed["imei"],
        "input": {"imei": parsed["imei"]},
        "result_markdown": markdown,
        "risk_level": None,
        "meta": parsed,
    }, user, req.case_id)


@router.post("/dns-recon")
async def dns_recon(req: DNSReconRequest, user: dict = Depends(get_current_user)):
    domain = req.domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Please enter a domain")
    if "://" in domain:
        domain = urlparse(domain).hostname or domain
    domain = domain.split("/")[0]
    if domain.startswith("www."):
        domain = domain[4:]
    try:
        result = await dns_service.recon(domain)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DNS recon failed: {e}")

    has_any = any(result["records"].get(rt) for rt in dns_service.RECORD_TYPES)
    if not has_any and not result["subdomains"]:
        raise HTTPException(status_code=400, detail="No DNS records found — check the domain is valid")

    ctx = dns_service.build_context(result)
    risk, markdown = await llm_service.analyze_dns(ctx)
    return await save_analysis({
        "tool_type": "dns-recon",
        "title": f"DNS & Subdomain Recon — {domain}",
        "target": domain,
        "input": {"domain": domain},
        "result_markdown": markdown,
        "risk_level": risk,
        "meta": result,
    }, user, req.case_id)