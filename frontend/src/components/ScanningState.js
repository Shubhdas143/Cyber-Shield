import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export function ScanningState({ label = "Scanning with secure AI…" }) {
  const [pct, setPct] = useState(8);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => (p >= 92 ? 92 : p + Math.random() * 9)), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative overflow-hidden rounded-[var(--cs-radius-md)] border border-[rgba(56,189,248,0.35)] bg-[var(--cs-surface-2)] p-7 text-center" data-testid="scanning-state">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--cs-primary-2)] to-transparent" style={{ animation: "cs-scan 1.8s linear infinite" }} />
      </div>
      <Loader2 className="mx-auto mb-3 animate-spin text-[var(--cs-primary-2)]" size={26} />
      <div className="cs-blink mb-4 text-xs uppercase tracking-[0.18em] text-[var(--cs-primary-2)]">{label}</div>
      <Progress value={pct} className="mx-auto h-1.5 max-w-sm" />
      <p className="mt-3 text-[11px] text-[var(--cs-muted)]">Querying intelligence sources & analysing indicators</p>
    </div>
  );
}
