import os
import re
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
PROVIDER = "anthropic"
MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = (
    "You are a senior cybersecurity analyst embedded with the Amroha Cyber Crime Police "
    "Station, Uttar Pradesh, India. You assist investigating officers with professional, "
    "accurate, court-mindful analysis. Always format using ## section headings and - bullet "
    "points, with **bold** for key terms. Cite specific Indian IT Act 2000/2008 sections "
    "(and IPC/BNS where relevant) when applicable. Be factual, concise, and actionable. "
    "Never fabricate data you were not given; clearly flag assumptions. Remind that AI "
    "findings are investigative leads that must be corroborated through official legal process."
)

_RISK_RE = re.compile(
    r"^[ \t>*-]*RISK_LEVEL[ \t]*:[ \t]*(CRITICAL|HIGH|MEDIUM|LOW|CLEAN|N/?A).*$",
    re.IGNORECASE | re.MULTILINE,
)


async def _run(session_id: str, prompt: str, max_tokens: int = 2200) -> str:
    chat = (
        LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=SYSTEM_PROMPT)
        .with_model(PROVIDER, MODEL)
        .with_params(max_tokens=max_tokens)
    )
    last_err = None
    for attempt in range(3):
        try:
            resp = await chat.send_message(UserMessage(text=prompt))
            return resp if isinstance(resp, str) else str(resp)
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"AI analysis failed after retries: {last_err}")


def _split_risk(text: str):
    """Extract a machine-readable RISK_LEVEL line, return (risk_lower|None, clean_markdown)."""
    m = _RISK_RE.search(text)
    risk = None
    if m:
        token = m.group(1).upper().replace("/", "")
        risk = None if token == "NA" else token.lower()
        text = _RISK_RE.sub("", text, count=1)
    return risk, text.strip()


# ------------------------------------------------------------------ IP
async def analyze_ip(ip: str, geo: dict | None):
    if geo:
        geo_ctx = (
            f"Country: {geo.get('country_name')} ({geo.get('country_code')}) | "
            f"Region: {geo.get('region')} | City: {geo.get('city')} | "
            f"ISP/Org: {geo.get('org')} | ASN: {geo.get('asn')} | "
            f"Timezone: {geo.get('timezone')} | Coords: {geo.get('latitude')},{geo.get('longitude')} | "
            f"Proxy/VPN: {geo.get('is_proxy')} | Hosting/Datacenter: {geo.get('is_hosting')} | "
            f"Mobile: {geo.get('is_mobile')}"
        )
    else:
        geo_ctx = "Geolocation: Unavailable (lookup failed)"

    prompt = f"""Analyze this IP address for an Indian cybercrime investigation.

IP: {ip}
{geo_ctx}

Return EXACTLY this structure. The VERY FIRST line must be a machine token:
RISK_LEVEL: <CRITICAL|HIGH|MEDIUM|LOW|CLEAN>

## THREAT LEVEL
State the level and a one-line justification.

## KEY FINDINGS
- bullet points (geo, ISP, hosting/proxy implications)

## INDICATORS OF CONCERN
- list suspicious indicators, or "None detected"

## INVESTIGATIVE ACTIONS
- concrete next steps for the officer (e.g. notice to ISP under which provision)

## APPLICABLE IT ACT SECTIONS
- relevant sections if suspicious, else "N/A — continue monitoring"
"""
    text = await _run(f"ip-{ip}", prompt)
    return _split_risk(text)


# ------------------------------------------------------------------ URL
async def analyze_url(url: str, parsed: str):
    prompt = f"""Analyze this URL for phishing / malicious activity in an Indian cybercrime context.

URL: {url}
Parsed: {parsed}

The VERY FIRST line must be:
RISK_LEVEL: <CRITICAL|HIGH|MEDIUM|LOW|CLEAN>

## RISK ASSESSMENT
**Verdict:** Malicious / Suspicious / Likely Safe / Safe
One-line reason.

## RED FLAGS DETECTED
- typosquatting, suspicious TLD, brand impersonation, URL shortener, redirect tricks, homoglyphs — or "None detected"

## DOMAIN ANALYSIS
- domain characteristics and trust indicators

## RECOMMENDED ACTIONS
- investigative steps (takedown, notice to registrar/host, preservation)

## APPLICABLE IT ACT SECTIONS
- e.g. Sections 66, 66C, 66D, 43 — or "N/A"
"""
    text = await _run(f"url-{abs(hash(url)) % 99999}", prompt)
    return _split_risk(text)


# ------------------------------------------------------------------ EMAIL
async def analyze_email(headers: str):
    prompt = f"""Perform email header forensics for an Indian cybercrime investigation.

--- RAW HEADERS ---
{headers}
--- END HEADERS ---

The VERY FIRST line must be:
RISK_LEVEL: <CRITICAL|HIGH|MEDIUM|LOW|CLEAN>

## ORIGIN ANALYSIS
- Originating IP (from earliest Received hop)
- Sender domain & Return-Path
- Reply-To (flag if different from From)
- SPF / DKIM / DMARC status (state if not present)

## SPOOFING DETECTION
**Spoofing Detected:** Yes / No / Suspicious
- supporting evidence bullets

## EMAIL ROUTING PATH
- trace each hop from origin to destination in order

## SUSPICIOUS PATTERNS
- patterns found, or "None detected"

## RECOMMENDED ACTIONS
- steps for investigators (preservation, notice to email provider)

## APPLICABLE IT ACT SECTIONS
- e.g. Sections 66, 66C, 66D, 66F — or "N/A"
"""
    text = await _run(f"email-{abs(hash(headers)) % 99999}", prompt)
    return _split_risk(text)


# ------------------------------------------------------------------ HASH
async def analyze_hashes(context: str):
    prompt = f"""A digital-evidence integrity check was performed. Provide a brief forensic note.

{context}

Do NOT include a RISK_LEVEL line. Use this structure:

## INTEGRITY VERDICT
- State clearly whether evidence integrity is preserved or compromised.

## FORENSIC INTERPRETATION
- What this means for the chain of custody and admissibility.

## ALGORITHM NOTE
- Reliability of the algorithm(s) used in a forensic context.

## RECOMMENDED HANDLING
- Evidence preservation / documentation steps (hash logging, write-blockers, Section 65B certificate).
"""
    text = await _run(f"hash-{abs(hash(context)) % 99999}", prompt, max_tokens=1200)
    _, clean = _split_risk(text)
    return clean


# ------------------------------------------------------------------ PORT SCAN
async def analyze_ports(target: str, ip: str, open_ports: list, scanned: int):
    if open_ports:
        ports_ctx = "\n".join(
            f"- Port {p['port']}/tcp — {p['service']} (open)" for p in open_ports
        )
    else:
        ports_ctx = "- No open TCP ports detected in the scanned set."

    prompt = f"""Analyze the results of a TCP port scan for an Indian cybercrime investigation.

Target: {target}
Resolved IP: {ip}
Ports scanned: {scanned}
Open ports found:
{ports_ctx}

The VERY FIRST line must be:
RISK_LEVEL: <CRITICAL|HIGH|MEDIUM|LOW|CLEAN>

## EXPOSURE SUMMARY
State the level and a one-line justification based on the open services.

## OPEN SERVICE ANALYSIS
- For each notable open port: what the service is and the risk it introduces (e.g., exposed RDP/SMB/database, plaintext protocols). If none open, say so.

## INDICATORS OF CONCERN
- Dangerous exposures (e.g., 3389 RDP, 445 SMB, 23 Telnet, 3306/5432/27017/6379 databases) or "None detected".

## INVESTIGATIVE ACTIONS
- Concrete next steps for the officer (service banner grabbing, preservation, notice to hosting provider).

## APPLICABLE IT ACT SECTIONS
- Relevant sections if the exposure relates to an offence, else "N/A — informational reconnaissance".
"""
    text = await _run(f"portscan-{abs(hash(target + ip)) % 99999}", prompt, max_tokens=1800)
    return _split_risk(text)


# ------------------------------------------------------------------ BREACH CHECK
async def analyze_breach(found: bool, count: int, strength_label: str):
    status = (f"This password was found in {count:,} known data-breach records."
              if found else "This password was NOT found in the known breach corpus.")
    prompt = f"""An officer checked a password against the global breach corpus (HaveIBeenPwned Pwned Passwords).
The plaintext password is NOT shared with you — only the breach result.

Result: {status}
Local strength assessment: {strength_label}

Do NOT include a RISK_LEVEL line. Provide a concise advisory:

## VERDICT
- One line on whether this password is safe to use.

## WHAT THIS MEANS
- Explain breach exposure and credential-stuffing / account-takeover risk for an investigation context.

## RECOMMENDED ACTIONS
- Steps for the officer / complainant (rotate credentials, enable 2FA, check linked accounts, preserve evidence of account compromise).

## INVESTIGATIVE RELEVANCE
- How a breached password is relevant when investigating an account-takeover or unauthorised-access complaint (reference Section 43 / 66 IT Act where access was unauthorised).
"""
    text = await _run(f"breach-{count}-{found}", prompt, max_tokens=900)
    _, clean = _split_risk(text)
    return clean


# ------------------------------------------------------------------ CASE REPORT
async def generate_case_report(f: dict):
    prompt = f"""Generate a formal cybercrime CASE REPORT for Indian law enforcement, suitable for FIR documentation and court proceedings.

Case No: {f.get('case_no') or 'TBD'}
Date: {f.get('date') or 'TBD'}
Station: {f.get('station')}
Victim/Complainant: {f.get('victim') or 'Not provided'}
Crime Type: {f.get('crime_type')}
Platform/Medium: {f.get('platform') or 'Online'}
Incident Summary: {f.get('summary')}
Suspect Information: {f.get('suspect') or 'Unknown — under investigation'}
Digital Evidence: {f.get('evidence') or 'Under investigation'}

Do NOT include a RISK_LEVEL line. Write a formal report with these sections:

## CASE SUMMARY
## INCIDENT DETAILS
## DIGITAL EVIDENCE INVENTORY
## APPLICABLE IT ACT SECTIONS
(For each: section number, name, and one line on why it applies. Include relevant IPC/BNS sections too.)
## RECOMMENDED INVESTIGATION STEPS
## EVIDENCE PRESERVATION GUIDELINES
(Mention Section 65B Indian Evidence Act certificate for electronic records.)

Use formal, precise language.
"""
    text = await _run(f"report-{abs(hash(str(f))) % 99999}", prompt, max_tokens=3000)
    _, clean = _split_risk(text)
    return clean
