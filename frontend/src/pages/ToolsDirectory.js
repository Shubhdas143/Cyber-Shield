import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, LibraryBig, Filter, Bot, Sparkles, Github, Building2, Target, Lightbulb } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

const TYPE_STYLE = {
  "ai-agentic": { label: "AI Agentic", icon: Bot, cls: "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.12)] text-[#D8B4FE]" },
  "ai": { label: "AI-Assisted", icon: Sparkles, cls: "border-[rgba(56,189,248,0.4)] bg-[rgba(56,189,248,0.12)] text-[#7DD3FC]" },
  "open-source": { label: "Open Source", icon: Github, cls: "border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#86EFAC]" },
  "commercial": { label: "Commercial", icon: Building2, cls: "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] text-[#FCD34D]" },
};

function TypeBadge({ type }) {
  const cfg = TYPE_STYLE[type] || { label: type, icon: LibraryBig, cls: "border-[var(--cs-border)] text-[var(--cs-muted)]" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.cls}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function ToolCard({ t }) {
  return (
    <div className="flex flex-col rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 transition-colors hover:border-[rgba(45,212,191,0.4)]" data-testid={`catalog-card-${t.id}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-[var(--cs-text)]">{t.name}</h3>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-[var(--cs-muted)]">{t.category}</div>
        </div>
        <TypeBadge type={t.type} />
      </div>
      <p className="text-xs leading-relaxed text-[var(--cs-muted)]">{t.description}</p>

      <div className="mt-3 space-y-2">
        <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)]/60 px-3 py-2">
          <div className="mb-0.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--cs-primary-2)]"><Target size={11} /> Usage</div>
          <p className="text-[11px] leading-relaxed text-[var(--cs-text)]/85">{t.usage}</p>
        </div>
        <div className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)]/60 px-3 py-2">
          <div className="mb-0.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#FCD34D]"><Lightbulb size={11} /> Best Case</div>
          <p className="text-[11px] leading-relaxed text-[var(--cs-text)]/85">{t.best_case}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(t.tags || []).map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[9.5px] font-mono text-[var(--cs-muted)]">#{tag}</span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--cs-border)] pt-3">
        <span className="text-[10.5px] text-[var(--cs-muted)]">{t.open_source ? "Open Source" : "Proprietary"} · {t.pricing}</span>
        <a href={t.url} target="_blank" rel="noreferrer" data-testid={`catalog-link-${t.id}`}
          className="inline-flex items-center gap-1 text-[11px] text-[var(--cs-primary-2)] hover:underline">
          Visit <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-[var(--cs-primary)] bg-[rgba(45,212,191,0.12)] text-[var(--cs-primary)]" : "border-[var(--cs-border)] text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5"}`}>
      {children}
    </button>
  );
}

export default function ToolsDirectory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    api.get("/catalog/tools").then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const tools = data?.tools || [];
    const q = search.trim().toLowerCase();
    return tools.filter((t) => {
      if (type && t.type !== type) return false;
      if (!q) return true;
      const hay = `${t.name} ${t.category} ${t.description} ${t.usage} ${t.best_case} ${(t.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, type]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--cs-text)]">Cyber Tools Directory</h2>
        <p className="text-sm text-[var(--cs-muted)]">A curated reference of AI-agentic, AI-assisted and open-source tools used in cyber-crime investigation — with usage and best-case scenarios.</p>
      </div>

      {/* Search + filters */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)]" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools, categories, tags (e.g. forensics, OSINT, malware)…" data-testid="catalog-search-input"
          className="border-[var(--cs-border)] bg-[var(--cs-surface)] pl-9 text-sm text-[var(--cs-text)]" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--cs-muted)]"><Filter size={12} /> Type</span>
        <FilterChip active={!type} onClick={() => setType("")} testId="catalog-filter-all">All</FilterChip>
        {(data?.types || []).map((ty) => (
          <FilterChip key={ty.id} active={type === ty.id} onClick={() => setType(ty.id)} testId={`catalog-filter-${ty.id}`}>{ty.label}</FilterChip>
        ))}
        {data && <span className="ml-auto text-[11px] text-[var(--cs-muted)]">{filtered.length} of {data.count} tools</span>}
      </div>

      {loading ? (
        <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] px-4 py-14 text-center text-sm text-[var(--cs-muted)]">Loading directory…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] px-4 py-14 text-center">
          <LibraryBig size={26} className="mb-2 text-[var(--cs-muted)]" />
          <div className="text-sm text-[var(--cs-text)]">No tools match your search</div>
          <p className="mt-1 text-xs text-[var(--cs-muted)]">Try a different keyword or clear the filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => <ToolCard key={t.id} t={t} />)}
        </div>
      )}
    </div>
  );
}
