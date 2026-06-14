import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { TOOL_MAP } from "@/lib/tools";
import { RiskChip } from "@/components/RiskChip";
import { formatTime } from "@/components/ToolResult";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUSES = ["Open", "In Progress", "Closed"];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get(`/cases/${id}`); setC(data); }
    catch { toast.error("Case not found"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    try { await api.put(`/cases/${id}`, { status }); setC((p) => ({ ...p, status })); toast.success("Status updated"); }
    catch { toast.error("Update failed"); }
  };

  const deleteCase = async () => {
    try { await api.delete(`/cases/${id}`); toast.success("Case deleted"); navigate("/cases"); }
    catch { toast.error("Delete failed"); }
  };

  if (loading) return <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Loading…</div>;
  if (!c) return <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Case not found. <Link to="/cases" className="text-[var(--cs-primary-2)] underline">Back</Link></div>;

  const analyses = c.analyses || [];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/cases")} className="inline-flex items-center gap-1.5 text-sm text-[var(--cs-muted)] hover:text-[var(--cs-text)] transition-colors" data-testid="case-back-button"><ArrowLeft size={15} /> All cases</button>

      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--cs-text)]">{c.title}</h2>
            <div className="mt-1 font-mono text-xs text-[var(--cs-muted)]">{c.case_no || "No case no."} {c.crime_type ? `· ${c.crime_type}` : ""} {c.platform ? `· ${c.platform}` : ""}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={c.status} onValueChange={updateStatus}>
              <SelectTrigger data-testid="case-status-select" className="h-9 w-36 border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-xs text-[var(--cs-text)]"><SelectValue /></SelectTrigger>
              <SelectContent className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-[var(--cs-text)]">
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button aria-label="Delete case" data-testid="case-delete-button" className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] p-2 text-[var(--cs-muted)] hover:text-[var(--cs-risk-high)] hover:bg-white/5 transition-colors"><Trash2 size={16} /></button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text)]">
                <AlertDialogHeader><AlertDialogTitle>Delete this case?</AlertDialogTitle><AlertDialogDescription className="text-[var(--cs-muted)]">Linked analyses will be kept in history but unlinked from this case.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-[var(--cs-border)] bg-transparent text-[var(--cs-text)] hover:bg-white/5">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteCase} className="bg-[var(--cs-risk-high)] text-white hover:bg-[#dc2626]">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {c.complainant && <p className="mt-3 text-sm text-[var(--cs-muted)]"><span className="text-[var(--cs-text)]">Complainant:</span> {c.complainant}</p>}
        {c.summary && <p className="mt-1 text-sm leading-relaxed text-[var(--cs-muted)]">{c.summary}</p>}
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[var(--cs-muted)]">Linked Analyses ({analyses.length})</h3>
        {analyses.length === 0 ? (
          <div className="rounded-[var(--cs-radius-lg)] border border-dashed border-[var(--cs-border)] px-4 py-10 text-center text-xs text-[var(--cs-muted)]">
            No analyses linked yet. Run any tool and select this case in “Attach to case”.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)]">
            <ul className="divide-y divide-[var(--cs-border)]">
              {analyses.map((a) => {
                const tool = TOOL_MAP[a.tool_type];
                const Icon = tool?.icon || Activity;
                return (
                  <li key={a.id}>
                    <Link to={`/history/${a.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]" data-testid={`case-analysis-${a.id}`}>
                      <Icon size={15} className="shrink-0 text-[var(--cs-muted)]" />
                      <div className="min-w-0 flex-1"><div className="truncate font-mono text-xs text-[var(--cs-text)]">{a.target}</div><div className="truncate text-[10.5px] text-[var(--cs-muted)]">{tool?.short} · {formatTime(a.created_at)}</div></div>
                      {a.risk_level ? <RiskChip risk={a.risk_level} size="sm" /> : <span className="text-[10px] text-[var(--cs-muted)]">—</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
