"""
POC: Validate the 4 most failure-prone core pieces of Cyber Shield in isolation.
1. Claude Sonnet 4.6 via Emergent Universal Key (forensic markdown analysis)
2. ipapi.co IP geolocation from backend
3. hashlib hash computation (MD5/SHA1/SHA256/SHA512)
4. reportlab FIR-ready PDF generation

Run: cd /app/backend && python poc_core.py
"""
import os
import asyncio
import hashlib
import io
import requests
from dotenv import load_dotenv

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

RESULTS = {}

SYS_PROMPT = (
    "You are a cybersecurity analyst embedded with the Amroha Cyber Crime Police Station, "
    "Uttar Pradesh, India. Assist investigators with professional, accurate analysis. "
    "Format using ## headings and - bullet points. Cite Indian IT Act 2000/2008 sections "
    "when relevant. Be factual, concise, actionable."
)


# ---------------- TEST 1: Claude Sonnet 4.6 via Emergent ----------------
async def test_llm():
    print("\n[TEST 1] Claude Sonnet 4.6 via Emergent Universal Key...")
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id="poc-ip-intel",
        system_message=SYS_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-6")

    prompt = """Analyze IP for cybercrime investigation:

IP: 103.21.58.100
Country: India (IN) | Region: Uttar Pradesh | City: Noida | ISP: Example Hosting | TZ: Asia/Kolkata

Provide:
## THREAT LEVEL
(Critical / High / Medium / Low / Clean) with reason
## KEY FINDINGS
- bullet points
## INVESTIGATIVE ACTIONS
- recommended steps
## APPLICABLE IT ACT SECTIONS
List relevant sections if suspicious, or N/A"""

    msg = UserMessage(text=prompt)
    resp = await chat.send_message(msg)
    text = resp if isinstance(resp, str) else str(resp)
    assert text and len(text) > 50, "LLM returned empty/short response"
    assert "##" in text, "LLM output missing markdown headings"
    print("  -> SUCCESS. Response length:", len(text))
    print("  -> Preview:\n" + "\n".join(text.splitlines()[:8]))
    RESULTS["llm"] = True
    return text


# ---------------- TEST 2: ipapi.co geolocation ----------------
def test_geo():
    print("\n[TEST 2] IP geolocation (ip-api.com primary, ipwho.is fallback)...")
    ip = "8.8.8.8"
    fields = ("status,message,country,countryCode,regionName,city,zip,lat,lon,"
              "timezone,isp,org,as,query,proxy,hosting,mobile")
    d = None
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields={fields}", timeout=12,
                         headers={"User-Agent": "Mozilla/5.0"})
        j = r.json()
        if j.get("status") == "success":
            d = {
                "ip": j.get("query"), "country_name": j.get("country"),
                "country_code": j.get("countryCode"), "region": j.get("regionName"),
                "city": j.get("city"), "org": j.get("isp") or j.get("org"),
                "timezone": j.get("timezone"), "latitude": j.get("lat"),
                "longitude": j.get("lon"), "is_proxy": j.get("proxy"),
                "is_hosting": j.get("hosting"), "asn": j.get("as"),
            }
    except Exception as e:
        print("  ip-api.com failed:", repr(e))
    if d is None:
        r = requests.get(f"https://ipwho.is/{ip}", timeout=12,
                         headers={"User-Agent": "Mozilla/5.0"})
        j = r.json()
        if not j.get("success"):
            raise RuntimeError(f"geo lookup failed: {j.get('message')}")
        d = {
            "ip": j.get("ip"), "country_name": j.get("country"),
            "country_code": j.get("country_code"), "region": j.get("region"),
            "city": j.get("city"), "org": (j.get("connection") or {}).get("isp"),
            "timezone": (j.get("timezone") or {}).get("id"),
            "latitude": j.get("latitude"), "longitude": j.get("longitude"),
        }
    print(f"  -> SUCCESS. {ip} => {d.get('country_name')} / {d.get('city')} / {d.get('org')} / proxy={d.get('is_proxy')} hosting={d.get('is_hosting')}")
    RESULTS["geo"] = True
    return d


# ---------------- TEST 3: hashlib ----------------
def test_hash():
    print("\n[TEST 3] hashlib hash computation...")
    data = b"Digital evidence sample - chain of custody test."
    digests = {
        "MD5": hashlib.md5(data).hexdigest(),
        "SHA-1": hashlib.sha1(data).hexdigest(),
        "SHA-256": hashlib.sha256(data).hexdigest(),
        "SHA-512": hashlib.sha512(data).hexdigest(),
    }
    assert len(digests["SHA-256"]) == 64, "SHA-256 length wrong"
    assert len(digests["MD5"]) == 32, "MD5 length wrong"
    # Verify match detection
    recompute = hashlib.sha256(data).hexdigest()
    assert recompute == digests["SHA-256"], "Hash mismatch on recompute"
    print("  -> SUCCESS. SHA-256:", digests["SHA-256"])
    RESULTS["hash"] = True
    return digests


# ---------------- TEST 4: reportlab PDF ----------------
def test_pdf(report_text):
    print("\n[TEST 4] reportlab FIR-ready PDF generation...")
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                     HRFlowable)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=20 * mm, bottomMargin=20 * mm,
                            leftMargin=18 * mm, rightMargin=18 * mm)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("t", parent=styles["Title"], fontSize=16,
                           textColor=colors.HexColor("#0B1A35"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12,
                        textColor=colors.HexColor("#1565C0"))
    body = ParagraphStyle("b", parent=styles["BodyText"], fontSize=10, leading=15)

    story = []
    story.append(Paragraph("AMROHA CYBER CRIME POLICE STATION", title))
    story.append(Paragraph("Uttar Pradesh, India — Digital Forensic Case Report", body))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#1565C0")))
    story.append(Spacer(1, 8))
    for line in (report_text or "## CASE SUMMARY\n- Test report").splitlines():
        line = line.strip()
        if not line:
            story.append(Spacer(1, 4))
        elif line.startswith("## "):
            story.append(Spacer(1, 4))
            story.append(Paragraph(line[3:], h2))
        elif line.startswith("- "):
            story.append(Paragraph("&bull; " + line[2:].replace("**", ""), body))
        else:
            story.append(Paragraph(line.replace("**", ""), body))
    doc.build(story)
    pdf_bytes = buf.getvalue()
    assert pdf_bytes.startswith(b"%PDF"), "PDF header invalid"
    out_path = "/tmp/poc_report.pdf"
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"  -> SUCCESS. PDF written {len(pdf_bytes)} bytes to {out_path}")
    RESULTS["pdf"] = True


async def main():
    print("=" * 60)
    print("CYBER SHIELD — CORE POC")
    print("=" * 60)
    print("EMERGENT_LLM_KEY present:", bool(EMERGENT_LLM_KEY))

    report_text = None
    try:
        report_text = await test_llm()
    except Exception as e:
        print("  -> FAILED:", repr(e))
        RESULTS["llm"] = False

    for fn in (test_geo, test_hash):
        try:
            fn()
        except Exception as e:
            print("  -> FAILED:", repr(e))
            RESULTS["geo" if fn is test_geo else "hash"] = False

    try:
        test_pdf(report_text)
    except Exception as e:
        print("  -> FAILED:", repr(e))
        RESULTS["pdf"] = False

    print("\n" + "=" * 60)
    print("POC RESULTS:", RESULTS)
    ok = all(RESULTS.get(k) for k in ["llm", "geo", "hash", "pdf"])
    print("OVERALL:", "ALL CORE PASSED ✅" if ok else "SOME FAILED ❌")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
