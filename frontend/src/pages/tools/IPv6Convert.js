import { useState } from "react";
import { ArrowRightLeft, Copy, Check, Binary } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CopyRow({ label, value, hint, testId }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error("Could not copy"); }
  };
  return (
    <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2.5" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{label}</div>
        <button onClick={copy} className="text-[var(--cs-muted)] hover:text-[var(--cs-primary)] transition-colors" aria-label={`Copy ${label}`}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <div className="mt-0.5 break-all font-mono text-xs text-[#6EE7B7]">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-[var(--cs-muted)]">{hint}</div>}
    </div>
  );
}

function ConversionGrid({ meta }) {
  const c = meta?.conversions;
  if (!c) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        <Binary size={12} /> IPv6 Representations
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <CopyRow label="IPv4-mapped" value={c.ipv4_mapped} hint="Most common — dual-stack sockets/logs" testId="conv-ipv4-mapped" />
        <CopyRow label="6to4 prefix" value={c.sixto4_prefix} hint="Auto-tunnelling 2002::/16" testId="conv-6to4" />
        <CopyRow label="IPv4-compatible (deprecated)" value={c.ipv4_compatible} hint="Legacy — RFC 4291 deprecated" testId="conv-compat" />
        <CopyRow label="Expanded (mapped)" value={c.ipv4_mapped_expanded} testId="conv-expanded" />
      </div>
    </div>
  );
}

export default function IPv6Convert() {
  const [ip, setIp] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!ip.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/ipv6-convert", { ip: ip.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Conversion failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="ipv6-convert" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <ConversionGrid meta={result?.meta} />}
        scanLabel="Converting address…"
        emptyIcon={ArrowRightLeft} emptyTitle="No address converted yet"
        emptyHint="Enter an IPv4 address to generate its IPv4-mapped, 6to4 and compatible IPv6 forms." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">IPv4 Address</Label>
          <Input value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. 103.21.58.10" data-testid="ipv6-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["8.8.8.8", "192.168.1.1", "103.21.58.10"].map((s) => (
              <button key={s} onClick={() => setIp(s)} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">{s}</button>
            ))}
          </div>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !ip.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <ArrowRightLeft size={15} className="mr-2" /> {scanning ? "Converting…" : "Convert to IPv6"}
        </Button>
      </div>
    </ToolLayout>
  );
}
