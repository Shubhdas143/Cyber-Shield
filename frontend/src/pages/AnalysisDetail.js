import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ToolResult } from "@/components/ToolResult";
import { EvidenceBlock } from "@/components/EvidenceBlock";

function GeoExtra({ geo }) {
  if (!geo) return null;
  const cells = [
    ["Country", `${geo.country_name || "—"} ${geo.country_code ? "(" + geo.country_code + ")" : ""}`],
    ["City / Region", `${geo.city || "—"}${geo.region ? ", " + geo.region : ""}`],
    ["ISP / Org", geo.org || "—"], ["ASN", geo.asn || "—"],
    ["Timezone", geo.timezone || "—"], ["Coordinates", geo.latitude != null ? `${geo.latitude}, ${geo.longitude}` : "—"],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]"><MapPin size={12} /> Geolocation</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 truncate font-mono text-xs text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashExtra({ meta }) {
  if (!meta) return null;
  return (
    <div className="space-y-3">
      {meta.match != null && (meta.match ? (
        <div className="flex items-center gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] px-3 py-2 text-sm text-[#6EE7B7]"><CheckCircle2 size={16} /> <b>Integrity verified</b> — hashes match.</div>
      ) : (
        <div className="flex items-center gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] px-3 py-2 text-sm text-[#FCA5A5]"><XCircle size={16} /> <b>Mismatch</b> — evidence may be tampered.</div>
      ))}
      {meta.digests && Object.entries(meta.digests).map(([algo, dg]) => <EvidenceBlock key={algo} label={algo} value={dg} />)}
    </div>
  );
}

export default function AnalysisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/history/${id}`).then((r) => setA(r.data)).catch(() => toast.error("Record not found")).finally(() => setLoading(false));
  }, [id]);

  let extra = null;
  if (a?.tool_type === "ip-intel") extra = <GeoExtra geo={a?.meta?.geo} />;
  else if (a?.tool_type === "hash-verify") extra = <HashExtra meta={a?.meta} />;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[var(--cs-muted)] hover:text-[var(--cs-text)] transition-colors" data-testid="detail-back-button">
        <ArrowLeft size={15} /> Back
      </button>
      {loading ? (
        <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Loading…</div>
      ) : !a ? (
        <div className="px-4 py-12 text-center text-sm text-[var(--cs-muted)]">Record not found. <Link to="/history" className="text-[var(--cs-primary-2)] underline">Back to history</Link></div>
      ) : (
        <>
          {a.case_id && (
            <Link to={`/cases/${a.case_id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] px-3 py-1 text-xs text-[var(--cs-primary-2)] hover:bg-white/5 transition-colors" data-testid="detail-case-link">Linked to case → view</Link>
          )}
          <ToolResult analysis={a} extra={extra} />
        </>
      )}
    </div>
  );
}
