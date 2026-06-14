import { TOOL_MAP } from "@/lib/tools";
import { ScanningState } from "@/components/ScanningState";
import { ToolResult } from "@/components/ToolResult";
import { AlertTriangle } from "lucide-react";

export function ToolLayout({ toolId, children, result }) {
  const tool = TOOL_MAP[toolId];
  const Icon = tool.icon;
  return (
    <div>
      <header className="mb-6 flex items-start gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--cs-radius-md)] border border-[rgba(45,212,191,0.3)] bg-[rgba(45,212,191,0.08)]">
          <Icon size={21} className="text-[var(--cs-primary)]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--cs-text)]">{tool.label}</h2>
          <p className="mt-0.5 text-sm text-[var(--cs-muted)]">{tool.desc}</p>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">{children}</div>
        <div className="lg:col-span-3">{result}</div>
      </div>
    </div>
  );
}

export function ErrorAlert({ msg }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--cs-radius-md)] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] px-4 py-3" data-testid="error-banner">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--cs-risk-high)]" />
      <span className="text-sm text-[#FCA5A5]">{msg}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="grid place-items-center rounded-[var(--cs-radius-lg)] border border-dashed border-[var(--cs-border)] bg-[var(--cs-surface)]/40 px-6 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--cs-surface-2)]">
        {Icon && <Icon size={22} className="text-[var(--cs-muted)]" />}
      </div>
      <div className="font-display text-sm font-medium text-[var(--cs-text)]">{title}</div>
      <p className="mt-1 max-w-xs text-xs text-[var(--cs-muted)]">{hint}</p>
    </div>
  );
}

export function ResultArea({ scanning, error, result, extra, scanLabel, emptyIcon, emptyTitle, emptyHint }) {
  if (scanning) return <ScanningState label={scanLabel} />;
  if (error) return <ErrorAlert msg={error} />;
  if (result) return <ToolResult analysis={result} extra={extra} showLink />;
  return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;
}
