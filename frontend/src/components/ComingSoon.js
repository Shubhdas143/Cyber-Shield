import { Sparkles } from "lucide-react";
import { COMING_SOON } from "@/lib/tools";

export function ComingSoon() {
  return (
    <section className="relative overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)]">
      <div className="absolute inset-0 opacity-[0.16]" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1697127997429-4155a247fece?crop=entropy&cs=srgb&fm=jpg&q=70&w=1200')",
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cs-surface)] via-[var(--cs-surface)]/85 to-[var(--cs-surface)]/55" />
      <div className="relative z-10 p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--cs-primary-2)]" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-[var(--cs-text)]">On the Roadmap</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMING_SOON.map((c) => (
            <div key={c.label} className="rounded-[var(--cs-radius-md)] border border-[var(--cs-border)] bg-[var(--cs-bg)]/60 p-4">
              <div className="mb-2 inline-flex rounded-full border border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--cs-primary-2)]">
                Coming Soon
              </div>
              <div className="font-display text-sm font-medium text-[var(--cs-text)]">{c.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--cs-muted)]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
