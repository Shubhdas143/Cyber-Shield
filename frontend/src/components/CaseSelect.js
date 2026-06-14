import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function CaseSelect({ value, onChange }) {
  const [cases, setCases] = useState([]);
  useEffect(() => {
    api.get("/cases").then((r) => setCases(r.data || [])).catch(() => {});
  }, []);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[var(--cs-muted)]">Attach to case (optional)</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
        <SelectTrigger data-testid="case-select-trigger" className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-sm text-[var(--cs-text)]">
          <SelectValue placeholder="No case linked" />
        </SelectTrigger>
        <SelectContent className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-[var(--cs-text)]">
          <SelectItem value="none">No case linked</SelectItem>
          {cases.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
