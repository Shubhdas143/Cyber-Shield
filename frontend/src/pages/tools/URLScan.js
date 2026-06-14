import { useState } from "react";
import { Search, Link2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function URLScan() {
  const [url, setUrl] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!url.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/url-scan", { url: url.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "URL scan failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="url-scan" result={
      <ResultArea scanning={scanning} error={error} result={result}
        scanLabel="Scanning for malicious patterns…"
        emptyIcon={Link2} emptyTitle="No URL scanned yet"
        emptyHint="Paste a suspicious link to detect phishing, typosquatting and brand impersonation." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Suspicious URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. http://hdfc-bank-secure.xyz/login" data-testid="url-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <p className="pt-1 text-[10.5px] text-[var(--cs-muted)]">The link is parsed locally and never visited — only its structure is analysed.</p>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !url.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Scanning…" : "Scan URL"}
        </Button>
      </div>
    </ToolLayout>
  );
}
