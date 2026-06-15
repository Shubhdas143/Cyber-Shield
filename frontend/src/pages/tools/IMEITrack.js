import { useState } from "react";
import { Search, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ImeiGrid({ meta }) {
  if (!meta) return null;
  const valid = meta.luhn_valid;
  const cells = [
    ["Type", meta.type],
    ["TAC", meta.tac],
    ["Reporting Body", `${meta.rbi} · ${meta.rbi_hint}`],
    ["Serial", meta.serial],
    ["Check Digit", meta.check_digit],
  ];
  return (
    <div>
      <div className={`mb-3 flex items-center gap-2 rounded-[var(--cs-radius-sm)] border px-3 py-2 text-sm ${valid ? "border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] text-[#6EE7B7]" : "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] text-[#FCA5A5]"}`} data-testid="imei-validity">
        {valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        <b>{valid ? "Valid IMEI" : "Invalid checksum"}</b> — Luhn check {valid ? "passed" : "failed (possible cloning/tampering)"}.
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IMEITrack() {
  const [imei, setImei] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!imei.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/imei-track", { imei: imei.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "IMEI analysis failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="imei-track" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <ImeiGrid meta={result?.meta} />}
        scanLabel="Validating IMEI & preparing guidance…"
        emptyIcon={Smartphone} emptyTitle="No IMEI analysed yet"
        emptyHint="Enter a 15-digit IMEI to validate it and get lawful device-tracing guidance (CEIR / TSP)." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">IMEI (15 digits)</Label>
          <Input value={imei} onChange={(e) => setImei(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. 490154203237518" data-testid="imei-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <p className="pt-1 text-[10.5px] text-[var(--cs-muted)]">Dial *#06# on a device to retrieve its IMEI. Tracing real-time location requires lawful telecom assistance.</p>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !imei.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Analysing…" : "Analyse IMEI"}
        </Button>
      </div>
    </ToolLayout>
  );
}
