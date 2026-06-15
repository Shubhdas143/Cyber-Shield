import { useState } from "react";
import { Search, Network, ServerCog, CheckCircle2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PortGrid({ meta }) {
  if (!meta) return null;
  const open = meta.open_ports || [];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        <ServerCog size={12} /> Scan Results
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["Resolved IP", meta.ip || "—"],
          ["Ports Scanned", meta.scanned ?? "—"],
          ["Open Ports", open.length],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 truncate font-mono text-xs text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
      {open.length === 0 ? (
        <div className="flex items-center gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)] px-3 py-2 text-xs text-[#86EFAC]">
          <CheckCircle2 size={14} /> No open TCP ports detected in the scanned set.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {open.map((p) => (
            <span key={p.port} data-testid={`open-port-${p.port}`}
              className="inline-flex items-center gap-1.5 rounded-[var(--cs-radius-sm)] border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] px-2.5 py-1 font-mono text-[11px] text-[#FCD34D]">
              <span className="font-semibold">{p.port}</span>
              <span className="text-[10px] text-[var(--cs-muted)]">{p.service}</span>
            </span>
          ))}
        </div>
      )}
      {meta.note && <p className="mt-2 text-[10.5px] text-[var(--cs-muted)]">{meta.note}</p>}
    </div>
  );
}

function ModeBtn({ value, mode, setMode, children }) {
  return (
    <button type="button" onClick={() => setMode(value)} data-testid={`port-mode-${value}`}
      className={`flex-1 rounded-[var(--cs-radius-sm)] border px-3 py-2 text-xs font-medium transition-colors ${
        mode === value
          ? "border-[var(--cs-primary)] bg-[rgba(45,212,191,0.12)] text-[var(--cs-primary)]"
          : "border-[var(--cs-border)] text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5"
      }`}>
      {children}
    </button>
  );
}

export default function PortScan() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState("common");
  const [startPort, setStartPort] = useState("1");
  const [endPort, setEndPort] = useState("1024");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!target.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const payload = { target: target.trim(), mode, case_id: caseId };
      if (mode === "common_range") {
        payload.start_port = parseInt(startPort, 10);
        payload.end_port = parseInt(endPort, 10);
      }
      const { data } = await api.post("/tools/port-scan", payload);
      setResult(data);
    } catch (e) { setError(apiError(e, "Port scan failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="port-scan" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <PortGrid meta={result?.meta} />}
        scanLabel="Probing TCP ports on target…"
        emptyIcon={Network} emptyTitle="No host scanned yet"
        emptyHint="Enter a hostname or IP to discover open TCP ports and get an AI exposure assessment." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Target Host / IP</Label>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. scanme.nmap.org or 45.33.32.156" data-testid="port-target-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["scanme.nmap.org", "google.com", "1.1.1.1"].map((s) => (
              <button key={s} onClick={() => setTarget(s)} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">{s}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Scan Scope</Label>
          <div className="flex gap-2">
            <ModeBtn value="common" mode={mode} setMode={setMode}>Common ports</ModeBtn>
            <ModeBtn value="common_range" mode={mode} setMode={setMode}>Common + range</ModeBtn>
          </div>
        </div>

        {mode === "common_range" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">Start Port</Label>
              <Input value={startPort} onChange={(e) => setStartPort(e.target.value)} type="number" min="1" max="65535"
                data-testid="port-start-input"
                className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">End Port</Label>
              <Input value={endPort} onChange={(e) => setEndPort(e.target.value)} type="number" min="1" max="65535"
                data-testid="port-end-input"
                className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
            </div>
            <p className="col-span-2 text-[10.5px] text-[var(--cs-muted)]">A custom range is capped at 1024 ports for performance. Common ports are always included.</p>
          </div>
        )}

        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !target.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Scanning…" : "Scan Ports"}
        </Button>
        <p className="text-[10.5px] leading-relaxed text-[var(--cs-muted)]">For authorised investigative use only. Scanning is a TCP connect probe — no exploitation is performed.</p>
      </div>
    </ToolLayout>
  );
}
