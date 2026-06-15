import { useState } from "react";
import { Search, Bug, Mail, Globe2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function KindBadge({ meta }) {
  if (!meta?.kind) return null;
  const isEmail = meta.kind === "email";
  const Icon = isEmail ? Mail : Globe2;
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.12)] px-2.5 py-1 text-[11px] font-medium text-[#D8B4FE]">
        <Icon size={12} /> Assessed as {isEmail ? "email address" : "domain"}
      </span>
      <span className="text-[10.5px] text-[var(--cs-muted)]">Advisory — verify against authoritative breach sources.</span>
    </div>
  );
}

export default function DarkWeb() {
  const [identifier, setIdentifier] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!identifier.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/dark-web", { identifier: identifier.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Exposure assessment failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="dark-web" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <KindBadge meta={result?.meta} />}
        scanLabel="Assessing exposure risk…"
        emptyIcon={Bug} emptyTitle="No identifier assessed yet"
        emptyHint="Enter an email address or domain to get an AI-driven breach / dark-web exposure advisory and verification steps." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Email address or Domain</Label>
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. victim@example.com or example.com" data-testid="darkweb-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <p className="pt-1 text-[10.5px] leading-relaxed text-[var(--cs-muted)]">This tool gives an AI risk advisory and verification steps. Live dark-web feeds require a paid intelligence subscription, which can be integrated later.</p>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !identifier.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Assessing…" : "Assess Exposure"}
        </Button>
      </div>
    </ToolLayout>
  );
}
