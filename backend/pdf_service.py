import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.enums import TA_CENTER

NAVY = colors.HexColor("#0B1A35")
BLUE = colors.HexColor("#1565C0")
MUTED = colors.HexColor("#5B6B7F")
SAFFRON = colors.HexColor("#F59E0B")
GREEN = colors.HexColor("#22C55E")

TOOL_LABELS = {
    "ip-intel": "IP Intelligence Analysis",
    "url-scan": "URL / Phishing Analysis",
    "email-forensics": "Email Header Forensics",
    "hash-verify": "Digital Evidence Hash Verification",
    "case-report": "Cyber Crime Case Report",
}


def _esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _inline(s: str) -> str:
    # render **bold** -> <b>
    out = _esc(s)
    parts = out.split("**")
    if len(parts) >= 3:
        rebuilt = ""
        for i, p in enumerate(parts):
            rebuilt += (f"<b>{p}</b>" if i % 2 == 1 else p)
        out = rebuilt
    return out


def build_pdf(analysis: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, topMargin=16 * mm, bottomMargin=18 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
        title=f"Cyber Shield Report {analysis.get('id','')}",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("t", parent=styles["Title"], fontSize=15, textColor=NAVY, spaceAfter=2)
    sub = ParagraphStyle("s", parent=styles["Normal"], fontSize=9, textColor=MUTED, alignment=TA_CENTER)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=11.5, textColor=BLUE,
                        spaceBefore=10, spaceAfter=4)
    body = ParagraphStyle("b", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=colors.HexColor("#1B2735"))
    bullet = ParagraphStyle("bu", parent=body, leftIndent=12, bulletIndent=2)
    meta = ParagraphStyle("m", parent=styles["Normal"], fontSize=8.5, textColor=MUTED)

    story = []
    # Ashoka trace line
    tri = Table([["", "", ""]], colWidths=[59 * mm, 59 * mm, 59 * mm], rowHeights=[2.4 * mm])
    tri.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), SAFFRON),
        ("BACKGROUND", (1, 0), (1, 0), colors.white),
        ("BACKGROUND", (2, 0), (2, 0), GREEN),
    ]))
    story.append(tri)
    story.append(Spacer(1, 6))
    story.append(Paragraph("AMROHA CYBER CRIME POLICE STATION", title))
    story.append(Paragraph("Uttar Pradesh, India &nbsp;|&nbsp; Cyber Shield Investigation Suite", sub))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 6))

    label = TOOL_LABELS.get(analysis.get("tool_type"), "Forensic Analysis Report")
    created = analysis.get("created_at", "")
    try:
        created_disp = datetime.fromisoformat(created).strftime("%d %b %Y, %H:%M UTC")
    except Exception:
        created_disp = created

    info = [
        ["Report Type:", label, "Report ID:", analysis.get("id", "")[:8]],
        ["Subject:", (analysis.get("target") or "-")[:60], "Generated:", created_disp],
        ["Officer:", analysis.get("officer_name", "-"), "Risk:", (analysis.get("risk_level") or "N/A").upper()],
    ]
    tbl = Table(info, colWidths=[24 * mm, 78 * mm, 22 * mm, 53 * mm])
    tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (2, 0), (2, -1), MUTED),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#C9D4E2")))

    md = analysis.get("result_markdown", "") or ""
    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            story.append(Spacer(1, 3))
            continue
        if line.startswith("## "):
            story.append(Paragraph(_esc(line[3:]).upper(), h2))
        elif line.startswith("### "):
            story.append(Paragraph(_inline(line[4:]), ParagraphStyle("h3", parent=body, fontName="Helvetica-Bold")))
        elif line.lstrip().startswith(("- ", "* ")):
            txt = line.lstrip()[2:]
            story.append(Paragraph("&bull;&nbsp; " + _inline(txt), bullet))
        elif line.startswith("#"):
            story.append(Paragraph(_esc(line.lstrip('#').strip()), h2))
        else:
            story.append(Paragraph(_inline(line), body))

    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#C9D4E2")))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "This report was produced with AI-assisted analysis by Cyber Shield. Findings are "
        "investigative leads and must be corroborated through due legal process. For authorized "
        "law-enforcement use only. Electronic records require a Section 65B (Indian Evidence Act) certificate.",
        meta))

    doc.build(story)
    return buf.getvalue()
