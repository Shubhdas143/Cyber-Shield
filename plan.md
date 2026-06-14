# Cyber Shield (Amroha Cyber Crime PS) — Development Plan

## 1) Objectives
- Deliver a working, production-grade cybersecurity investigation suite for police use (5 tools) that is **more advanced than a basic port scanner**.
- Implement secure **backend-only AI** using **Emergent Universal Key** with **Anthropic Claude Sonnet 4.6** (`claude-sonnet-4-6`).
- Provide **persistent history + case management** in MongoDB (search, view, delete) and **FIR-ready PDF export**.
- Add **simple officer login (JWT)** with seeded default account + test bypass.
- Ship a polished, police-appropriate UI with clear risk levels and audit-friendly outputs.

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (isolation; do not proceed until green)
**Goal:** prove the failure-prone parts work end-to-end in one Python script.

**User stories (POC)**
1. As an investigator, I can call Claude Sonnet 4.6 from Python using `EMERGENT_LLM_KEY` and receive consistent markdown output.
2. As an investigator, I can geolocate an IP via `ipapi.co` from the backend environment.
3. As an investigator, I can compute MD5/SHA1/SHA256/SHA512 for a sample file using `hashlib`.
4. As an investigator, I can generate a FIR-style PDF report and open it successfully.
5. As an investigator, I can save a combined “analysis record” JSON payload (future DB shape) and re-load it.

**Steps**
- Add `/app/backend/.env`: `EMERGENT_LLM_KEY=...` and verify `load_dotenv()` usage.
- Write `poc_core.py` that:
  - Calls Claude via `emergentintegrations.llm.chat.LlmChat().with_model("anthropic","claude-sonnet-4-6")`.
  - Calls `https://ipapi.co/{ip}/json/` and normalizes key fields.
  - Hashes a known test file and prints computed digests.
  - Generates a PDF (reportlab or fpdf2) using a realistic FIR template.
- Iterate prompts/templates until output is stable (structured headings, risk rating, citations).
- Stop Phase 1 only when script runs cleanly twice with reproducible results.

### Phase 2 — V1 App Development (MVP; minimal bulk changes; no auth yet)
**Goal:** build working FARM app around proven core flows; all 5 tools functional; history/cases; PDF download.

**User stories (V1)**
1. As an investigator, I can run IP Intelligence and get geo + threat assessment and save it.
2. As an investigator, I can scan a suspicious URL and receive phishing indicators with a risk rating.
3. As an investigator, I can paste email headers and get spoofing/routing analysis with clear verdict.
4. As an investigator, I can verify evidence integrity by computing and comparing hashes.
5. As an investigator, I can generate a case report, save it, and download it as a PDF.

**Backend (FastAPI @ 0.0.0.0:8001; all routes `/api`)**
- Project structure: `app/backend` with routers: `tools.py`, `history.py`, `cases.py`, `reports.py`.
- Mongo models/collections (minimal, MVP):
  - `analyses` (toolType, input, output, risk, createdAt, caseId?)
  - `cases` (title, complainant, incident summary, status, linkedAnalysisIds)
  - `reports` (caseId, reportMarkdown, itActSections, createdAt)
- Implement endpoints:
  - `POST /api/tools/ip-intel`
  - `POST /api/tools/url-scan`
  - `POST /api/tools/email-forensics`
  - `POST /api/tools/hash-verify` (file upload or text compare; MVP can start with text input + optional upload)
  - `POST /api/tools/case-report`
  - `GET /api/history` (+ filters), `GET /api/history/{id}`, `DELETE /api/history/{id}`
  - `GET/POST /api/cases`, `GET /api/cases/{id}`
  - `GET /api/reports/{id}/pdf`
  - `GET /api/stats`
- LLM utilities:
  - Central helper for prompts + streaming (SSE) where useful; store final compiled response.
- PDF generation:
  - Backend generates PDF from stored report (and optionally any analysis) and streams download.

**Frontend (React + shadcn/ui)**
- Pages: Login (placeholder for now), Dashboard, 5 tool pages, History, Case Detail/Report View.
- Dashboard: recent activity, quick launch tiles, Coming Soon banner (Phone/UPI, Breach checker, Bulk CSV).
- UI standards:
  - Threat level chips (Critical/High/Medium/Low/Clean), monospace blocks for technical artifacts.
  - Clear “Copy” and “Save to Case” actions.
- Env wiring: `REACT_APP_BACKEND_URL` and robust loading/error states.

**Phase 2 close-out**
- Run one full end-to-end test: each tool → stored history → case link → report → PDF download.
- Call testing agent for E2E verification and bug list.

### Phase 3 — Auth + Hardening + UX polish
**Goal:** add police login, lock down access, improve reliability, and finalize “production-grade” behavior.

**User stories (Auth/Hardening)**
1. As an officer, I can log in and my session persists securely.
2. As an admin, I can create officer accounts (simple register endpoint; can be protected later).
3. As an officer, I can only see my station’s saved cases/history (MVP: shared; later: per-user).
4. As an officer, I can export PDFs repeatedly with consistent formatting.
5. As an officer, I can search history quickly by IP/URL/email subject/hash.

**Steps**
- Implement JWT auth:
  - `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
  - Seed default account; add a configurable test bypass flag for local testing.
- Apply auth guards to all `/api/tools/*`, `/api/history*`, `/api/cases*`, `/api/reports*`.
- Add role fields (`officer`, `admin`) minimally.
- Add rate limiting/basic abuse controls (simple per-IP throttles) and strict request validation.
- Observability: structured logs for scans; store minimal audit trail.
- Call design_agent for final law-enforcement theming pass; implement consistently.
- Call testing agent for authenticated E2E.

### Phase 4 — Stabilization, Compliance Fit, and Documentation
**User stories (Release)**
1. As a supervisor, I can review saved cases and reports and verify integrity trails.
2. As an officer, I can explain AI results because outputs cite reasons and IT Act sections.
3. As an officer, I can run the app reliably on station hardware with clear setup steps.
4. As an investigator, I can attach analysis artifacts to a case without losing context.
5. As a user, I see “Coming Soon” tools but am not blocked by them.

**Steps**
- Tighten FIR template wording for Indian context (IT Act 2000/2008, IPC where applicable; configurable).
- Add input sanitization, safe URL handling, and SSRF protections for any fetching.
- Add basic unit tests for parsers and PDF generator.
- Write README: setup, seeded credentials, workflow, data retention notes.

## 3) Next Actions (immediate)
1. Create `poc_core.py` and run it: Claude call + ipapi + hashlib + PDF generation.
2. If any POC piece fails, iterate until stable (no app scaffolding until green).
3. Once green, scaffold FastAPI + Mongo collections + the 5 tool endpoints (no auth yet).
4. Build React UI pages and wire to backend; verify all tool flows + history + cases + PDF.
5. Add JWT auth + seed user + protect routes; run final authenticated E2E.

## 4) Success Criteria
- POC script runs successfully and produces: (a) Claude markdown analysis, (b) ipapi geo JSON, (c) correct hashes, (d) valid PDF.
- V1 app: all 5 tools work via backend, store to MongoDB, searchable history, case linking, and PDF download works.
- Auth: JWT login works; unauthenticated users cannot access tools/history/cases/reports.
- UI: clear risk ratings, copy/save actions, professional police theme, no exposed API keys.
- No mocked data: all analyses generated live; DB persistence verified across restarts.
