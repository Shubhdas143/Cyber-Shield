import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, History, FolderKanban, LogOut, Menu, Radar, Plus } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { useAuth } from "@/context/AuthContext";
import { AshokaLine } from "@/components/AshokaLine";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function NavItem({ to, icon: Icon, label, end, onClick, testId }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} data-testid={testId}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-[var(--cs-radius-sm)] px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-white/[0.06] text-[var(--cs-text)]"
            : "text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/[0.04]"
        }`
      }>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-full bg-[var(--cs-primary)]" />}
          <Icon size={17} className={isActive ? "text-[var(--cs-primary)]" : ""} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarBody({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <AshokaLine className="mb-3 max-w-[160px]" />
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[var(--cs-radius-sm)] border border-[rgba(45,212,191,0.3)] bg-[rgba(45,212,191,0.1)]">
            <Shield size={19} className="text-[var(--cs-primary)]" />
          </div>
          <div>
            <div className="font-display text-[15px] font-bold tracking-[0.14em] text-[var(--cs-text)]">CYBER SHIELD</div>
            <div className="text-[9.5px] uppercase tracking-[0.12em] text-[var(--cs-muted)]">Amroha Cyber Crime PS</div>
          </div>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">
          <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} testId="nav-dashboard" />
        </div>
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cs-muted)]/70">Investigate</div>
          <div className="space-y-1">
            {TOOLS.map((t) => (
              <NavItem key={t.id} to={t.path} icon={t.icon} label={t.short} onClick={onNavigate} testId={`nav-${t.id}`} />
            ))}
          </div>
        </div>
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cs-muted)]/70">Records</div>
          <div className="space-y-1">
            <NavItem to="/history" icon={History} label="Investigation History" onClick={onNavigate} testId="nav-history" />
            <NavItem to="/cases" icon={FolderKanban} label="Cases" onClick={onNavigate} testId="nav-cases" />
          </div>
        </div>
      </nav>

      <div className="border-t border-[var(--cs-border)] p-3">
        <div className="flex items-center gap-3 rounded-[var(--cs-radius-sm)] px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--cs-surface-2)] text-xs font-semibold text-[var(--cs-primary)]">
            {(user?.name || "O").split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[var(--cs-text)]">{user?.name || "Officer"}</div>
            <div className="truncate text-[10px] text-[var(--cs-muted)]">{user?.officer_id} · {user?.rank}</div>
          </div>
          <button onClick={logout} aria-label="Log out" data-testid="logout-button"
            className="rounded p-1.5 text-[var(--cs-muted)] hover:bg-white/5 hover:text-[var(--cs-risk-high)] transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitle(location.pathname);

  return (
    <div className="cs-shell min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--cs-border)] bg-[var(--cs-surface)]/80 backdrop-blur lg:block">
        <SidebarBody />
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--cs-border)] bg-[var(--cs-bg)]/85 px-4 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded p-1.5 text-[var(--cs-muted)] hover:bg-white/5 lg:hidden" aria-label="Open menu" data-testid="mobile-menu-button">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-[var(--cs-border)] bg-[var(--cs-surface)] p-0">
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="font-display text-sm font-semibold tracking-wide text-[var(--cs-text)] md:text-base">{title}</h1>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/cases")} data-testid="topbar-new-case"
              className="hidden h-8 gap-1.5 border-[var(--cs-border)] bg-transparent text-xs text-[var(--cs-muted)] hover:text-[var(--cs-text)] sm:inline-flex">
              <Plus size={14} /> New Case
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)] px-2.5 py-1">
              <Radar size={12} className="text-[var(--cs-risk-low)]" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#86EFAC]">AI Online</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function pageTitle(path) {
  if (path === "/") return "Operations Dashboard";
  if (path.startsWith("/history")) return "Investigation History";
  if (path.startsWith("/cases")) return "Case Management";
  const t = TOOLS.find((x) => path.startsWith(x.path));
  return t ? t.label : "Cyber Shield";
}
