import { useState } from "react";
import { Search, LockKeyhole, ShieldCheck, ShieldAlert } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CertGrid({ meta }) {
  const c = meta?.certificate;
  if (!c) return null;
  const bad = c.is_expired || c.self_signed || c.not_yet_valid;
  const cells = [
    ["Subject (CN)", c.subject_cn || "—"],
    ["Issuer (CN)", c.issuer_cn || "—"],
    ["Valid From", c.valid_from],
    ["Valid To", c.valid_to],
    ["Days to Expiry", String(c.days_until_expiry)],
    ["TLS / Cipher", `${c.tls_version || "—"}`],
    ["Signature", c.signature_algorithm || "—"],
    ["Serial", c.serial],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        {bad ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />} Certificate
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Flag on={c.is_expired} label={c.is_expired ? "Expired" : "Not expired"} />
        <Flag on={c.self_signed} label={c.self_signed ? "Self-signed" : "CA-signed"} />
        {c.not_yet_valid && <Flag on label="Not yet valid" />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 break-all font-mono text-[11px] text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
      {(c.san || []).length > 0 && (
        <div className="mt-2 rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
          <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">Subject Alternative Names ({c.san.length})</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.san.slice(0, 30).map((s) => <span key={s} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 font-mono text-[10px] text-[var(--cs-muted)]">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
function Flag({ on, label }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${on ? "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.12)] text-[#FCA5A5]" : "border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.1)] text-[#86EFAC]"}`}>{label}</span>
  );
}

export default function SSLInspect() {
  const [host, setHost] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!host.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/ssl-inspect", { host: host.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Certificate inspection failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="ssl-inspect" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <CertGrid meta={result?.meta} />}
        scanLabel="Fetching & analysing certificate…"
        emptyIcon={LockKeyhole} emptyTitle="No certificate inspected yet"
        emptyHint="Enter a host/domain to fetch its TLS certificate and check for expiry, self-signing and impersonation." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Host / Domain (port 443)</Label>
          <Input value={host} onChange={(e) => setHost(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. github.com" data-testid="ssl-host-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["github.com", "google.com", "expired.badssl.com"].map((s) => (
              <button key={s} onClick={() => setHost(s)} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">{s}</button>
            ))}
          </div>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !host.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Inspecting…" : "Inspect Certificate"}
        </Button>
      </div>
    </ToolLayout>
  );
}
