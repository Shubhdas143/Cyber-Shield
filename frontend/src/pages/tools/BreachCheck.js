import { useState } from "react";
import { KeyRound, Eye, EyeOff, ShieldAlert, ShieldCheck } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function BreachSummary({ meta }) {
  if (!meta) return null;
  const found = meta.found;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        {found ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />} Breach Result
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-[var(--cs-radius-sm)] border px-3 py-2 ${found ? "border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)]" : "border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.08)]"}`}>
          <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">Status</div>
          <div className={`mt-0.5 font-mono text-xs font-semibold ${found ? "text-[#FCA5A5]" : "text-[#86EFAC]"}`}>
            {found ? "EXPOSED" : "NOT FOUND"}
          </div>
        </div>
        <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
          <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">Times Seen</div>
          <div className="mt-0.5 font-mono text-xs text-[#6EE7B7]">{(meta.count ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
          <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">Strength</div>
          <div className="mt-0.5 font-mono text-xs text-[#6EE7B7]">{meta.strength || "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default function BreachCheck() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!password) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/breach-check", { password, case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Breach check failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="breach-verify" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <BreachSummary meta={result?.meta} />}
        scanLabel="Checking breach corpus securely…"
        emptyIcon={KeyRound} emptyTitle="No password checked yet"
        emptyHint="Enter a password to check it against billions of breached credentials. It is hashed locally and never stored." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Password to check</Label>
          <div className="relative">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
              type={show ? "text" : "password"} placeholder="Enter password…" data-testid="breach-password-input"
              className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] pr-10 font-mono text-sm text-[var(--cs-text)]" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle visibility"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--cs-muted)] hover:text-[var(--cs-text)]">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="pt-1 text-[10.5px] leading-relaxed text-[var(--cs-muted)]">
            Privacy-safe k-anonymity check: only the first 5 characters of the password's SHA-1 hash leave this server. The plaintext is never transmitted or saved.
          </p>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !password} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <KeyRound size={15} className="mr-2" /> {scanning ? "Checking…" : "Check for Breaches"}
        </Button>
      </div>
    </ToolLayout>
  );
}
