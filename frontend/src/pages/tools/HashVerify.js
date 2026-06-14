import { useState } from "react";
import { Hash, FileCheck2, GitCompareArrows, CheckCircle2, XCircle } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { EvidenceBlock } from "@/components/EvidenceBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function MatchBanner({ match }) {
  if (match == null) return null;
  return match ? (
    <div className="flex items-center gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] px-3 py-2 text-sm text-[#6EE7B7]" data-testid="hash-match-banner">
      <CheckCircle2 size={16} /> <b>Integrity verified</b> — hashes match.
    </div>
  ) : (
    <div className="flex items-center gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] px-3 py-2 text-sm text-[#FCA5A5]" data-testid="hash-match-banner">
      <XCircle size={16} /> <b>Mismatch</b> — evidence may be tampered or corrupted.
    </div>
  );
}

function HashExtra({ meta }) {
  if (!meta) return null;
  return (
    <div className="space-y-3">
      <MatchBanner match={meta.match} />
      {meta.digests && (
        <div className="space-y-2">
          {Object.entries(meta.digests).map(([algo, dg]) => (
            <EvidenceBlock key={algo} label={algo} value={dg} testId={`hash-${algo.toLowerCase()}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HashVerify() {
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  // file mode
  const [file, setFile] = useState(null);
  const [expected, setExpected] = useState("");
  // compare mode
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");

  const runFile = async () => {
    if (!file) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (expected.trim()) fd.append("expected", expected.trim());
      if (caseId) fd.append("case_id", caseId);
      const { data } = await api.post("/tools/hash-file", fd);
      setResult(data);
    } catch (e) { setError(apiError(e, "Hash computation failed")); }
    finally { setScanning(false); }
  };

  const runCompare = async () => {
    if (!h1.trim() || !h2.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/hash-compare", { hash1: h1.trim(), hash2: h2.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Hash comparison failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="hash-verify" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <HashExtra meta={result.meta} />}
        scanLabel="Computing & analysing hashes…"
        emptyIcon={Hash} emptyTitle="No evidence verified yet"
        emptyHint="Compute hashes from a file or compare two hashes to confirm digital evidence integrity." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[var(--cs-surface-2)]">
            <TabsTrigger value="file" data-testid="hash-tab-file" className="data-[state=active]:bg-[var(--cs-bg)] data-[state=active]:text-[var(--cs-primary)]">
              <FileCheck2 size={14} className="mr-1.5" /> From File
            </TabsTrigger>
            <TabsTrigger value="compare" data-testid="hash-tab-compare" className="data-[state=active]:bg-[var(--cs-bg)] data-[state=active]:text-[var(--cs-primary)]">
              <GitCompareArrows size={14} className="mr-1.5" /> Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">Evidence File</Label>
              <Input type="file" data-testid="hash-file-input" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-sm text-[var(--cs-text)] file:mr-3 file:rounded file:border-0 file:bg-[var(--cs-primary)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black" />
              {file && <p className="text-[11px] text-[var(--cs-muted)]">{file.name} · {(file.size / 1024).toFixed(2)} KB</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">Expected hash (optional)</Label>
              <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste known-good hash to verify" data-testid="hash-expected-input"
                className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-xs text-[var(--cs-text)]" />
            </div>
            <CaseSelect value={caseId} onChange={setCaseId} />
            <Button onClick={runFile} disabled={scanning || !file} data-testid="tool-analyze-button"
              className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
              <Hash size={15} className="mr-2" /> {scanning ? "Computing…" : "Compute & Verify"}
            </Button>
          </TabsContent>

          <TabsContent value="compare" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">Hash 1 (computed / evidence)</Label>
              <Input value={h1} onChange={(e) => setH1(e.target.value)} placeholder="e.g. e318a424…" data-testid="hash-compare-1"
                className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-xs text-[var(--cs-text)]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[var(--cs-muted)]">Hash 2 (expected / reference)</Label>
              <Input value={h2} onChange={(e) => setH2(e.target.value)} placeholder="e.g. e318a424…" data-testid="hash-compare-2"
                className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-xs text-[var(--cs-text)]" />
            </div>
            <CaseSelect value={caseId} onChange={setCaseId} />
            <Button onClick={runCompare} disabled={scanning || !h1.trim() || !h2.trim()} data-testid="tool-analyze-button"
              className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
              <GitCompareArrows size={15} className="mr-2" /> {scanning ? "Comparing…" : "Compare Hashes"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
}
