import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { formatTime } from "@/components/ToolResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const STATUS_CLS = {
  Open: "border-[rgba(56,189,248,0.4)] bg-[rgba(56,189,248,0.1)] text-[var(--cs-primary-2)]",
  "In Progress": "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] text-[#FCD34D]",
  Closed: "border-[var(--cs-border)] bg-white/5 text-[var(--cs-muted)]",
};

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", case_no: "", complainant: "", crime_type: "", platform: "", summary: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls = "border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-sm text-[var(--cs-text)]";

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/cases"); setCases(data || []); }
    catch { toast.error("Could not load cases"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) { toast.error("Case title is required"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/cases", form);
      setOpen(false);
      setForm({ title: "", case_no: "", complainant: "", crime_type: "", platform: "", summary: "" });
      toast.success("Case created");
      navigate(`/cases/${data.id}`);
    } catch (e) { toast.error(apiError(e, "Could not create case")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--cs-text)]">Case Management</h2>
          <p className="text-sm text-[var(--cs-muted)]">Group analyses under an investigation and track its status.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-case-button" className="bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]"><Plus size={15} className="mr-1.5" /> New Case</Button>
          </DialogTrigger>
          <DialogContent className="border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text)]">
            <DialogHeader><DialogTitle className="font-display">Open a new case</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Case Title *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. UPI fraud – Ramesh Kumar" data-testid="case-title-input" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Case Number</Label><Input value={form.case_no} onChange={(e) => set("case_no", e.target.value)} placeholder="CY/2025/001" data-testid="case-no-input" className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Crime Type</Label><Input value={form.crime_type} onChange={(e) => set("crime_type", e.target.value)} placeholder="UPI Fraud…" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Complainant</Label><Input value={form.complainant} onChange={(e) => set("complainant", e.target.value)} placeholder="Name" className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Platform</Label><Input value={form.platform} onChange={(e) => set("platform", e.target.value)} placeholder="WhatsApp…" className={inputCls} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-[var(--cs-muted)]">Summary</Label><Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Brief description…" className={`h-20 resize-y ${inputCls}`} /></div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={saving} data-testid="create-case-submit" className="bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">{saving ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Plus size={15} className="mr-1.5" />}Create Case</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Loading…</div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--cs-radius-lg)] border border-dashed border-[var(--cs-border)] px-4 py-16 text-center">
          <FolderKanban size={26} className="mb-2 text-[var(--cs-muted)]" />
          <div className="text-sm text-[var(--cs-text)]">No cases yet</div>
          <p className="mt-1 text-xs text-[var(--cs-muted)]">Open a case to organise related analyses and reports.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <button key={c.id} onClick={() => navigate(`/cases/${c.id}`)} data-testid={`case-card-${c.id}`}
              className="group flex flex-col rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 text-left transition-colors hover:border-[rgba(45,212,191,0.5)] hover:bg-[var(--cs-surface-2)]">
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[c.status] || STATUS_CLS.Open}`}>{c.status}</span>
                <ChevronRight size={15} className="text-[var(--cs-muted)] transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-2 font-display text-sm font-semibold text-[var(--cs-text)]">{c.title}</div>
              <div className="mt-0.5 font-mono text-[11px] text-[var(--cs-muted)]">{c.case_no || "No case no."} {c.crime_type ? `· ${c.crime_type}` : ""}</div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--cs-border)] pt-2 text-[11px] text-[var(--cs-muted)]">
                <span>{c.analysis_count} {c.analysis_count === 1 ? "analysis" : "analyses"}</span>
                <span>{formatTime(c.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
