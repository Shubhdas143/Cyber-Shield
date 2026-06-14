import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Copy, Check, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { RiskChip } from "@/components/RiskChip";
import { MarkdownPanel } from "@/components/MarkdownPanel";
import { TOOL_MAP } from "@/lib/tools";
import { AshokaLine } from "@/components/AshokaLine";

export function formatTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
}

export async function downloadAnalysisPdf(id, setLoading) {
  try {
    setLoading?.(true);
    const res = await api.get(`/history/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `CyberShield_${id.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  } catch (e) {
    toast.error("Could not generate PDF");
  } finally {
    setLoading?.(false);
  }
}

export function ToolResult({ analysis, extra, showLink = false }) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  if (!analysis) return null;
  const tool = TOOL_MAP[analysis.tool_type];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(analysis.result_markdown || "");
      setCopied(true);
      toast.success("Analysis copied");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Could not copy"); }
  };

  return (
    <div className="cs-fade-up overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] shadow-[var(--cs-shadow-1)]" data-testid="tool-result-panel">
      <AshokaLine />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--cs-border)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cs-muted)]">{tool?.label || "Analysis"}</span>
            {analysis.risk_level && <RiskChip risk={analysis.risk_level} size="sm" />}
          </div>
          <div className="mt-1 break-all font-mono text-sm text-[var(--cs-text)]" data-testid="result-target">{analysis.target}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--cs-muted)]">
            <Clock size={11} /> {formatTime(analysis.created_at)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copy} data-testid="result-copy-button"
            className="inline-flex items-center gap-1.5 rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] px-3 py-1.5 text-xs text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => downloadAnalysisPdf(analysis.id, setPdfLoading)} disabled={pdfLoading} data-testid="report-download-pdf-button"
            className="inline-flex items-center gap-1.5 rounded-[var(--cs-radius-sm)] bg-[var(--cs-primary)] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#34e6cf] disabled:opacity-60 transition-colors">
            <Download size={13} /> {pdfLoading ? "Preparing…" : "PDF"}
          </button>
          {showLink && (
            <Link to={`/history/${analysis.id}`} data-testid="result-view-link"
              className="inline-flex items-center gap-1.5 rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] px-3 py-1.5 text-xs text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">
              <ExternalLink size={13} /> Open
            </Link>
          )}
        </div>
      </div>
      {extra && <div className="border-b border-[var(--cs-border)] px-5 py-4">{extra}</div>}
      <div className="px-5 py-4">
        <MarkdownPanel testId="result-markdown">{analysis.result_markdown}</MarkdownPanel>
      </div>
    </div>
  );
}
