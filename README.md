# Cyber Shield — Amroha Cyber Crime Police Station 

An AI-assisted cybercrime investigation suite for law-enforcement use. Built with **FastAPI + MongoDB** (backend) and **React + Tailwind / shadcn-ui** (frontend), with secure backend-only AI powered by **Anthropic Claude (Sonnet)** via the Emergent universal key.

Every analysis is logged to investigation **History**, can be linked to a **Case**, and exported as a court-friendly **PDF** report citing relevant **IT Act** sections.

---

## Quick Start

The app runs under `supervisor` (do not start servers manually):

```bash
sudo supervisorctl restart all      # backend + frontend + mongodb
sudo supervisorctl status
```

- Backend: FastAPI on `0.0.0.0:8001`, all routes prefixed with `/api`
- Frontend: React (served by craco/webpack)
- Database: local MongoDB (`MONGO_URL`, `DB_NAME=cyber_shield`)

### Environment variables
`backend/.env`
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cyber_shield"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY="<emergent universal key>"
```
`frontend/.env`
```
REACT_APP_BACKEND_URL="<external preview/prod URL>"
```

### Demo login
| Field | Value |
|------|-------|
| Officer ID | `amroha001` |
| Password | `cyber@123` |

(Seeded automatically on backend startup. Use the **"Use demo officer credentials"** button on the login page.)

---

## Tools & Example Inputs (for demonstration)

> Tip: each example below is safe to paste directly into the corresponding tool. Public test targets like `scanme.nmap.org` (run by the Nmap project) and `expired.badssl.com` are explicitly provided for testing.

### 1. IP Intelligence  `/tools/ip-intel`
Geolocates an IP and runs an AI threat assessment.
- `8.8.8.8`
- `1.1.1.1`
- `103.21.58.10`

### 2. URL / Phishing Scanner  `/tools/url-scan`
Detects phishing, typosquatting and brand impersonation (the link is parsed, never visited).
- `http://hdfc-bank-secure.xyz/login`
- `https://paypa1-verify.com/account`
- `https://www.google.com`

### 3. DNS & Subdomain Recon  `/tools/dns-recon`
Enumerates A/AAAA/MX/NS/TXT/CNAME/SOA records and discovers common subdomains.
- `github.com`
- `google.com`

### 4. SSL/TLS Certificate Inspector  `/tools/ssl-inspect`
Fetches a host's TLS certificate and flags expiry / self-signing / impersonation.
- `github.com` (valid)
- `expired.badssl.com` (expired — demonstrates HIGH risk)
- `self-signed.badssl.com` (self-signed)

### 5. Port Scanner  `/tools/port-scan`
Async TCP-connect scan of common ports (+ an optional custom range, capped at 1024).
- Target: `scanme.nmap.org`, Scope: **Common ports** → expect `22 (SSH)`, `80 (HTTP)` open
- Target: `scanme.nmap.org`, Scope: **Common + range**, Start `20`, End `90`
- Target: `1.1.1.1`, Scope: **Common ports**

### 6. IPv4 → IPv6 Converter  `/tools/ipv6-convert`
Returns IPv4-mapped, 6to4 and IPv4-compatible IPv6 forms.
- `103.21.58.10`  → mapped `::ffff:103.21.58.10`, 6to4 `2002:6715:3a0a::/48`
- `192.168.1.1`
- `8.8.8.8`

### 7. Email Header Forensics  `/tools/email-forensics`
Paste **raw** email headers to trace origin, detect spoofing and map routing.
```
Received: from mail.suspicious-domain.ru (mail.suspicious-domain.ru [185.220.101.5])
    by mx.google.com with ESMTPS id abc123
    for <victim@gmail.com>; Mon, 10 Jun 2025 09:15:00 -0700 (PDT)
From: "SBI Bank" <alert@sbi-secure-verify.ru>
Reply-To: phisher@protonmail.com
Subject: Urgent: Your account will be blocked
Date: Mon, 10 Jun 2025 21:45:00 +0530
Message-ID: <random123@suspicious-domain.ru>
```

### 8. Image & EXIF Forensics  `/tools/exif-forensics`
Upload a photo (JPEG/TIFF/PNG) to extract GPS, camera and edit metadata.
- Best demo: a photo **taken on a phone with location enabled** (carries GPS + device tags).
- Note: most social-media platforms strip EXIF on upload — use an original camera file.

### 9. Hash Verifier  `/tools/hash-verify`
**From File:** upload any file to compute MD5/SHA-1/SHA-256/SHA-512, optionally compare to an expected hash.
**Compare:** paste two hashes, e.g.
- Hash 1: `5d41402abc4b2a76b9719d911017c592`
- Hash 2: `5d41402abc4b2a76b9719d911017c592` (identical → integrity verified)
- (the value above is the MD5 of the word `hello`)

### 10. Password Breach Checker  `/tools/breach-check`
Privacy-safe k-anonymity check against HaveIBeenPwned (plaintext never stored/sent).
- `password` → EXPOSED (~52M times) — CRITICAL
- `123456` → EXPOSED
- `Zx9$kQ2mFvL8tR4wPn7!aB` → NOT FOUND (clean)

### 11. Dark Web Exposure  `/tools/dark-web`
AI exposure advisory + verification steps for an email or domain.
- `victim@example.com`
- `example.com`

### 12. IMEI / Device Analysis  `/tools/imei-track`
Validates IMEI (Luhn), breaks down its structure and explains lawful tracing (CEIR / TSP).
- `490154203237518` → VALID checksum
- `356938035643809` → VALID checksum
- `490154203237510` → INVALID checksum (demonstrates possible tampering)

### 13. Case Report Generator  `/tools/case-report`
Generates a FIR-ready report. Example fields:
- Crime Type: `Online Financial Fraud (UPI)`
- Platform: `WhatsApp + UPI`
- Incident Summary: `Complainant received a call impersonating a bank official and was tricked into approving a UPI collect request of Rs. 85,000.`
- Suspect Info: `Mobile 98XXXXXXXX, UPI id fraudster@oksbi`
- Evidence: `Screenshots of chat, transaction reference numbers`

---

## Reference

### Cyber Tools Directory  `/tools-directory`
A curated, searchable catalogue of **AI-agentic**, **AI-assisted**, **open-source** and **commercial** tools used in cyber-crime investigation (Nmap, Wireshark, Autopsy, Volatility, Maltego, Shodan, PentestGPT, Microsoft Security Copilot, Cellebrite, Chainalysis, and more) — each with its **usage** and **best-case scenario**. Filter by type or search by keyword/tag.

---

## API Overview (all under `/api`, JWT Bearer required except auth)
- `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
- `POST /tools/ip-intel | url-scan | email-forensics | port-scan | dns-recon | ssl-inspect | ipv6-convert | hash-file | hash-compare | exif-forensics | breach-check | dark-web | imei-track | case-report`
- `GET /history`, `GET /history/{id}`, `DELETE /history/{id}`, `GET /history/{id}/pdf`
- `GET/POST /cases`, `GET /cases/{id}`
- `GET /stats`
- `GET /catalog/tools`

## Notes
- AI findings are **investigative leads** and must be corroborated through due legal process.
- Electronic records require a **Section 65B (Indian Evidence Act)** certificate.
- The Password Breach Checker never stores the plaintext password; the Dark Web tool is an AI advisory (no live dark-web feed without a paid intelligence subscription).
