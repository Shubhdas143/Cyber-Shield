import { useState } from "react";
import { Search, Globe2, ListTree } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RECORD_ORDER = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"];

function DnsGrid({ meta }) {
  if (!meta) return null;
  const recs = meta.records || {};
  const subs = meta.subdomains || [];
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
          <ListTree size={12} /> DNS Records
        </div>
        <div className="space-y-2">
          {RECORD_ORDER.map((rt) => {
            const vals = recs[rt] || [];
            return (
              <div key={rt} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
                <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{rt}</div>
                {vals.length ? (
                  <div className="mt-0.5 space-y-0.5">
                    {vals.map((v, i) => <div key={i} className="break-all font-mono text-[11px] text-[#6EE7B7]">{v}</div>)}
                  </div>
                ) : <div className="mt-0.5 font-mono text-[11px] text-[var(--cs-muted)]">none</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">Discovered Subdomains ({subs.length})</div>
        {subs.length ? (
          <div className="flex flex-wrap gap-1.5">
            {subs.map((s) => (
              <span key={s.subdomain} data-testid={`dns-sub-${s.subdomain}`}
                className="inline-flex items-center gap-1.5 rounded-[var(--cs-radius-sm)] border border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] px-2.5 py-1 font-mono text-[11px] text-[#7DD3FC]">
                {s.subdomain}
              </span>
            ))}
          </div>
        ) : <p className="text-xs text-[var(--cs-muted)]">No subdomains found from the common wordlist.</p>}
      </div>
    </div>
  );
}

export default function DNSRecon() {
  const [domain, setDomain] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!domain.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/dns-recon", { domain: domain.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "DNS recon failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="dns-recon" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <DnsGrid meta={result?.meta} />}
        scanLabel="Resolving records & enumerating subdomains…"
        emptyIcon={Globe2} emptyTitle="No domain analysed yet"
        emptyHint="Enter a domain to enumerate its DNS records and discover common subdomains." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Domain</Label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. example.com" data-testid="dns-domain-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["github.com", "google.com"].map((s) => (
              <button key={s} onClick={() => setDomain(s)} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">{s}</button>
            ))}
          </div>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !domain.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Scanning…" : "Run DNS Recon"}
        </Button>
      </div>
    </ToolLayout>
  );
}
