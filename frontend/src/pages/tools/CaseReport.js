import { useState } from "react";
import { FileText } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[var(--cs-muted)]">{label}</Label>
      {children}
    </div>
  );
}

export default function CaseReport() {
  const today = new Date().toLocaleDateString("en-IN");
  const [f, setF] = useState({
    case_no: "", date: today, victim: "", crime_type: "", platform: "",
    summary: "", suspect: "", evidence: "",
  });
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const inputCls = "border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-sm text-[var(--cs-text)]";

  const run = async () => {
    if (!f.crime_type.trim() || !f.summary.trim()) { setError("Crime type and incident summary are required"); return; }
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/case-report", { ...f, case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Report generation failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="case-report" result={
      <ResultArea scanning={scanning} error={error} result={result}
        scanLabel="Drafting FIR-ready case report…"
        emptyIcon={FileText} emptyTitle="No report generated yet"
        emptyHint="Fill in the incident details to generate a formal report citing applicable IT Act sections, ready for PDF export." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Case Number"><Input value={f.case_no} onChange={(e) => set("case_no", e.target.value)} placeholder="CY/2025/001" data-testid="report-caseno-input" className={inputCls} /></Field>
          <Field label="Date"><Input value={f.date} onChange={(e) => set("date", e.target.value)} data-testid="report-date-input" className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Crime Type *"><Input value={f.crime_type} onChange={(e) => set("crime_type", e.target.value)} placeholder="UPI Fraud, Stalking…" data-testid="report-crimetype-input" className={inputCls} /></Field>
          <Field label="Platform / Medium"><Input value={f.platform} onChange={(e) => set("platform", e.target.value)} placeholder="WhatsApp, UPI…" data-testid="report-platform-input" className={inputCls} /></Field>
        </div>
        <Field label="Victim / Complainant"><Input value={f.victim} onChange={(e) => set("victim", e.target.value)} placeholder="Name & contact" data-testid="report-victim-input" className={inputCls} /></Field>
        <Field label="Incident Summary *"><Textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Describe what happened, when and how…" data-testid="report-summary-input" className={`h-24 resize-y ${inputCls}`} /></Field>
        <Field label="Suspect Information"><Textarea value={f.suspect} onChange={(e) => set("suspect", e.target.value)} placeholder="Name, phone, email, social profiles, IP…" data-testid="report-suspect-input" className={`h-20 resize-y ${inputCls}`} /></Field>
        <Field label="Digital Evidence"><Textarea value={f.evidence} onChange={(e) => set("evidence", e.target.value)} placeholder="Screenshots, transaction IDs, chat logs…" data-testid="report-evidence-input" className={`h-20 resize-y ${inputCls}`} /></Field>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !f.crime_type.trim() || !f.summary.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <FileText size={15} className="mr-2" /> {scanning ? "Generating…" : "Generate Case Report"}
        </Button>
      </div>
    </ToolLayout>
  );
}
