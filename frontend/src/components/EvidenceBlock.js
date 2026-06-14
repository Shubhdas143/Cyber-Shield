import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function EvidenceBlock({ label, value, testId }) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-black/30">
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--cs-muted)]">{label}</span>
        <button onClick={copy} data-testid={testId ? `${testId}-copy` : undefined}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors"
          aria-label={`Copy ${label}`}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-3 py-2.5 font-mono text-xs leading-relaxed text-[var(--cs-text)] overflow-x-auto whitespace-pre-wrap break-all" data-testid={testId}>{text}</pre>
    </div>
  );
}
