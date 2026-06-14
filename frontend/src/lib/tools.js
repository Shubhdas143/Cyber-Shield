import { Globe, Link2, Mail, Hash, FileText } from "lucide-react";

export const TOOLS = [
  {
    id: "ip-intel",
    path: "/tools/ip-intel",
    label: "IP Intelligence",
    short: "IP Intel",
    icon: Globe,
    desc: "Geolocate IPs and run AI threat assessment.",
    hint: "Trace & profile IP addresses",
  },
  {
    id: "url-scan",
    path: "/tools/url-scan",
    label: "URL / Phishing Scanner",
    short: "URL Scanner",
    icon: Link2,
    desc: "Detect phishing, typosquatting and brand impersonation.",
    hint: "Inspect suspicious links",
  },
  {
    id: "email-forensics",
    path: "/tools/email-forensics",
    label: "Email Header Forensics",
    short: "Email Forensics",
    icon: Mail,
    desc: "Trace origin, detect spoofing and map routing.",
    hint: "Analyse raw email headers",
  },
  {
    id: "hash-verify",
    path: "/tools/hash-verify",
    label: "Hash Verifier",
    short: "Hash Verifier",
    icon: Hash,
    desc: "Compute & compare hashes for evidence integrity.",
    hint: "Verify digital evidence",
  },
  {
    id: "case-report",
    path: "/tools/case-report",
    label: "Case Report Generator",
    short: "Case Report",
    icon: FileText,
    desc: "Generate FIR-ready reports citing IT Act sections.",
    hint: "Draft court-ready reports",
  },
];

export const TOOL_MAP = TOOLS.reduce((acc, t) => ((acc[t.id] = t), acc), {});

export const COMING_SOON = [
  { label: "Phone / UPI Fraud Lookup", desc: "Trace mobile numbers and UPI IDs linked to fraud." },
  { label: "Password Breach Checker", desc: "Check credentials against known breach corpora." },
  { label: "Bulk IP / URL Analysis", desc: "Upload a CSV and triage indicators in batch." },
];
