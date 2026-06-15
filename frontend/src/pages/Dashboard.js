import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertOctagon, FolderKanban, ScanLine, ArrowRight, ChevronRight, LibraryBig } from "lucide-react";
import api from "@/lib/api";
import { TOOLS, TOOL_MAP } from "@/lib/tools";
import { useAuth } from "@/context/AuthContext";
import { RiskChip } from "@/components/RiskChip";
import { ComingSoon } from "@/components/ComingSoon";
import { formatTime } from "@/components/ToolResult";

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4" data-testid={`kpi-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-[var(--cs-muted)]">{label}</span>
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-[var(--cs-text)]">{value ?? "—"}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const recent = stats?.recent_activity || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cs-text)]">
          Welcome, {user?.name?.split(" ").slice(-1)[0] || "Officer"}
        </h2>
        <p className="text-sm text-[var(--cs-muted)]">Amroha Cyber Crime Police Station · Live investigation console</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={ScanLine} label="Scans Today" value={stats?.today_scans} accent="#2DD4BF" />
        <Kpi icon={AlertOctagon} label="High / Critical" value={stats?.high_critical} accent="#EF4444" />
        <Kpi icon={FolderKanban} label="Active Cases" value={stats?.total_cases} accent="#38BDF8" />
        <Kpi icon={Activity} label="Total Analyses" value={stats?.total_analyses} accent="#F59E0B" />
      </div>

      {/* Tools + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-[var(--cs-muted)]">Investigation Tools</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => navigate(t.path)} data-testid={`dashboard-quick-launch-${t.id}`}
                  className="group flex items-start gap-3 rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 text-left transition-colors hover:border-[rgba(45,212,191,0.5)] hover:bg-[var(--cs-surface-2)]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--cs-radius-md)] border border-[var(--cs-border)] bg-[var(--cs-bg)] text-[var(--cs-primary)] group-hover:border-[rgba(45,212,191,0.4)]">
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-display text-sm font-semibold text-[var(--cs-text)]">
                      {t.label}
                      <ChevronRight size={14} className="text-[var(--cs-muted)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-muted)]">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-[var(--cs-muted)]">Recent Activity</h3>
            <Link to="/history" className="inline-flex items-center gap-1 text-xs text-[var(--cs-primary-2)] hover:underline" data-testid="dashboard-view-all-history">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)]">
            {recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-[var(--cs-muted)]">No analyses yet. Run a tool to get started.</div>
            ) : (
              <ul className="divide-y divide-[var(--cs-border)]">
                {recent.map((a) => {
                  const tool = TOOL_MAP[a.tool_type];
                  const Icon = tool?.icon || Activity;
                  return (
                    <li key={a.id}>
                      <Link to={`/history/${a.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]" data-testid={`activity-item-${a.id}`}>
                        <Icon size={15} className="shrink-0 text-[var(--cs-muted)]" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-xs text-[var(--cs-text)]">{a.target}</div>
                          <div className="truncate text-[10.5px] text-[var(--cs-muted)]">{tool?.short} · {formatTime(a.created_at)}</div>
                        </div>
                        {a.risk_level ? <RiskChip risk={a.risk_level} size="sm" testId={`activity-risk-${a.id}`} /> : <span className="text-[10px] text-[var(--cs-muted)]">—</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Link to="/tools-directory" data-testid="dashboard-tools-directory-cta"
        className="group flex items-center gap-4 rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 transition-colors hover:border-[rgba(56,189,248,0.5)] hover:bg-[var(--cs-surface-2)]">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--cs-radius-md)] border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.1)] text-[var(--cs-primary-2)]">
          <LibraryBig size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold text-[var(--cs-text)]">Cyber Tools Directory</div>
          <p className="mt-0.5 text-xs text-[var(--cs-muted)]">Browse AI-agentic, AI-assisted & open-source investigation tools used by cyber police — with usage and best-case scenarios.</p>
        </div>
        <ArrowRight size={16} className="shrink-0 text-[var(--cs-muted)] transition-transform group-hover:translate-x-0.5" />
      </Link>

      <ComingSoon />
    </div>
  );
}
