import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, Eye, Download, Filter, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { TOOLS, TOOL_MAP } from "@/lib/tools";
import { RiskChip } from "@/components/RiskChip";
import { formatTime, downloadAnalysisPdf } from "@/components/ToolResult";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const RISKS = ["critical", "high", "medium", "low", "clean"];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toolType, setToolType] = useState("");
  const [risk, setRisk] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (toolType) params.tool_type = toolType;
      if (risk) params.risk = risk;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/history", { params });
      setItems(data || []);
    } catch { toast.error("Could not load history"); }
    finally { setLoading(false); }
  }, [toolType, risk, search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const doDelete = async () => {
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/history/${id}`);
      setItems((p) => p.filter((x) => x.id !== id));
      toast.success("Record deleted");
    } catch { toast.error("Delete failed"); }
  };

  const Chip = ({ active, onClick, children, testId }) => (
    <button onClick={onClick} data-testid={testId}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-[var(--cs-primary)] bg-[rgba(45,212,191,0.12)] text-[var(--cs-primary)]" : "border-[var(--cs-border)] text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5"}`}>
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--cs-text)]">Investigation History</h2>
        <p className="text-sm text-[var(--cs-muted)]">Every analysis is logged for audit and case linkage.</p>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)]" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by IP, URL, hash, sender, crime type…" data-testid="history-search-input"
          className="border-[var(--cs-border)] bg-[var(--cs-surface)] pl-9 text-sm text-[var(--cs-text)]" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--cs-muted)]"><Filter size={12} /> Tool</span>
        <Chip active={!toolType} onClick={() => setToolType("")} testId="filter-tool-all">All</Chip>
        {TOOLS.map((t) => <Chip key={t.id} active={toolType === t.id} onClick={() => setToolType(t.id)} testId={`filter-tool-${t.id}`}>{t.short}</Chip>)}
        <span className="ml-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--cs-muted)]">Risk</span>
        <Chip active={!risk} onClick={() => setRisk("")} testId="filter-risk-all">All</Chip>
        {RISKS.map((r) => <Chip key={r} active={risk === r} onClick={() => setRisk(r)} testId={`filter-risk-${r}`}>{r}</Chip>)}
      </div>

      <div className="overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] shadow-[var(--cs-shadow-1)]">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center">
            <HistoryIcon size={26} className="mb-2 text-[var(--cs-muted)]" />
            <div className="text-sm text-[var(--cs-text)]">No records found</div>
            <p className="mt-1 text-xs text-[var(--cs-muted)]">Run a tool to start building investigation history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--cs-border)] hover:bg-transparent">
                  <TableHead className="text-[var(--cs-muted)]">Timestamp</TableHead>
                  <TableHead className="text-[var(--cs-muted)]">Tool</TableHead>
                  <TableHead className="text-[var(--cs-muted)]">Target</TableHead>
                  <TableHead className="text-[var(--cs-muted)]">Risk</TableHead>
                  <TableHead className="text-right text-[var(--cs-muted)]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => {
                  const tool = TOOL_MAP[a.tool_type];
                  const Icon = tool?.icon;
                  return (
                    <TableRow key={a.id} className="border-[var(--cs-border)] hover:bg-white/[0.03]" data-testid={`history-row-${a.id}`}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-[var(--cs-muted)]">{formatTime(a.created_at)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-[var(--cs-text)]"><span className="inline-flex items-center gap-1.5">{Icon && <Icon size={13} className="text-[var(--cs-muted)]" />}{tool?.short}</span></TableCell>
                      <TableCell className="max-w-[260px] truncate font-mono text-xs text-[var(--cs-text)]" title={a.target}>{a.target}</TableCell>
                      <TableCell>{a.risk_level ? <RiskChip risk={a.risk_level} size="sm" testId={`history-risk-${a.id}`} /> : <span className="text-xs text-[var(--cs-muted)]">—</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/history/${a.id}`)} aria-label="View" data-testid={`history-view-${a.id}`} className="rounded p-1.5 text-[var(--cs-muted)] hover:bg-white/5 hover:text-[var(--cs-primary-2)] transition-colors"><Eye size={15} /></button>
                          <button onClick={() => downloadAnalysisPdf(a.id)} aria-label="Download PDF" data-testid={`history-pdf-${a.id}`} className="rounded p-1.5 text-[var(--cs-muted)] hover:bg-white/5 hover:text-[var(--cs-primary)] transition-colors"><Download size={15} /></button>
                          <button onClick={() => setPendingDelete(a.id)} aria-label="Delete" data-testid={`history-delete-${a.id}`} className="rounded p-1.5 text-[var(--cs-muted)] hover:bg-white/5 hover:text-[var(--cs-risk-high)] transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--cs-muted)]">This permanently removes the analysis from investigation history. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--cs-border)] bg-transparent text-[var(--cs-text)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} data-testid="confirm-delete-button" className="bg-[var(--cs-risk-high)] text-white hover:bg-[#dc2626]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
