import { useState } from "react";
import { Search, Mail } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = `Delivered-To: victim@gmail.com
Received: from mail-server.fake-hdfc.in (103.21.58.10) by mx.google.com
Received: from unknown (HELO localhost) (attacker)
From: HDFC Bank <noreply@hdfc-bank-secure.xyz>
Reply-To: attacker123@protonmail.com
Return-Path: <bounce@hdfc-bank-secure.xyz>
Authentication-Results: mx.google.com; spf=fail; dkim=none; dmarc=fail
Subject: Urgent: Your account is locked
Date: Mon, 1 Jan 2025 10:00:00 +0530`;

export default function EmailForensics() {
  const [headers, setHeaders] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (headers.trim().length < 10) { setError("Please paste the raw email headers"); return; }
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/email-forensics", { headers: headers.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "Email forensics failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="email-forensics" result={
      <ResultArea scanning={scanning} error={error} result={result}
        scanLabel="Performing email header forensics…"
        emptyIcon={Mail} emptyTitle="No headers analysed yet"
        emptyHint="Paste raw email headers to trace the origin, detect spoofing and map the routing path." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Raw Email Headers</Label>
          <Textarea value={headers} onChange={(e) => setHeaders(e.target.value)}
            placeholder="Paste the full raw headers here (From, Received, Reply-To, SPF/DKIM/DMARC…)" data-testid="email-headers-input"
            className="h-56 resize-y border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-xs leading-relaxed text-[var(--cs-text)]" />
          <button onClick={() => setHeaders(SAMPLE)} data-testid="load-sample-button"
            className="rounded-[var(--cs-radius-sm)] border border-dashed border-[var(--cs-border)] px-3 py-1.5 text-[11px] text-[var(--cs-muted)] hover:bg-white/5 transition-colors">
            Load sample headers
          </button>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !headers.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Analysing…" : "Analyse Headers"}
        </Button>
      </div>
    </ToolLayout>
  );
}
