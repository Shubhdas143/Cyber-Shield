import { ShieldAlert, ShieldCheck, AlertTriangle, Siren, CircleCheck, CircleHelp } from "lucide-react";

const MAP = {
  critical: { label: "CRITICAL", icon: Siren, cls: "bg-[rgba(249,115,22,0.14)] text-[#FDBA74] border-[rgba(249,115,22,0.4)]" },
  high: { label: "HIGH", icon: ShieldAlert, cls: "bg-[rgba(239,68,68,0.14)] text-[#FCA5A5] border-[rgba(239,68,68,0.4)]" },
  medium: { label: "MEDIUM", icon: AlertTriangle, cls: "bg-[rgba(245,158,11,0.14)] text-[#FCD34D] border-[rgba(245,158,11,0.4)]" },
  low: { label: "LOW", icon: ShieldCheck, cls: "bg-[rgba(34,197,94,0.14)] text-[#86EFAC] border-[rgba(34,197,94,0.4)]" },
  clean: { label: "CLEAN", icon: CircleCheck, cls: "bg-[rgba(16,185,129,0.14)] text-[#6EE7B7] border-[rgba(16,185,129,0.4)]" },
};

export function RiskChip({ risk, size = "md", testId = "risk-verdict-chip" }) {
  const key = (risk || "").toLowerCase();
  const cfg = MAP[key] || { label: "INFO", icon: CircleHelp, cls: "bg-white/5 text-[var(--cs-muted)] border-[var(--cs-border)]" };
  const Icon = cfg.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${pad} ${cfg.cls}`}>
      <Icon size={size === "sm" ? 11 : 13} />
      {cfg.label}
    </span>
  );
}
