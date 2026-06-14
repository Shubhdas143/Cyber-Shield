import { useState } from "react";
import { Search, Globe, MapPin } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GeoGrid({ geo }) {
  if (!geo) return <p className="text-xs text-[var(--cs-muted)]">Geolocation unavailable for this IP.</p>;
  const cells = [
    ["Country", `${geo.country_name || "—"} ${geo.country_code ? "(" + geo.country_code + ")" : ""}`],
    ["City / Region", `${geo.city || "—"}${geo.region ? ", " + geo.region : ""}`],
    ["ISP / Org", geo.org || "—"],
    ["ASN", geo.asn || "—"],
    ["Timezone", geo.timezone || "—"],
    ["Coordinates", geo.latitude != null ? `${geo.latitude}, ${geo.longitude}` : "—"],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        <MapPin size={12} /> Geolocation
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 truncate font-mono text-xs text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {geo.is_proxy != null && <Flag on={geo.is_proxy} label={geo.is_proxy ? "Proxy / VPN detected" : "No proxy / VPN"} />}
        {geo.is_hosting != null && <Flag on={geo.is_hosting} label={geo.is_hosting ? "Hosting / Datacenter" : "Residential / Non-DC"} />}
        {geo.is_mobile != null && geo.is_mobile && <Flag on label="Mobile network" />}
      </div>
    </div>
  );
}
function Flag({ on, label }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${on ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] text-[#FCD34D]" : "border-[var(--cs-border)] text-[var(--cs-muted)]"}`}>{label}</span>
  );
}

export default function IPIntel() {
  const [ip, setIp] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!ip.trim()) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const { data } = await api.post("/tools/ip-intel", { ip: ip.trim(), case_id: caseId });
      setResult(data);
    } catch (e) { setError(apiError(e, "IP analysis failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="ip-intel" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <GeoGrid geo={result?.meta?.geo} />}
        scanLabel="Running IP threat intelligence…"
        emptyIcon={Globe} emptyTitle="No IP analysed yet"
        emptyHint="Enter an IPv4 or IPv6 address to fetch geolocation and an AI threat assessment." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">IP Address</Label>
          <Input value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. 103.21.58.10" data-testid="ip-input"
            className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] font-mono text-sm text-[var(--cs-text)]" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["8.8.8.8", "1.1.1.1", "103.21.58.10"].map((s) => (
              <button key={s} onClick={() => setIp(s)} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--cs-muted)] hover:text-[var(--cs-text)] hover:bg-white/5 transition-colors">{s}</button>
            ))}
          </div>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !ip.trim()} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Search size={15} className="mr-2" /> {scanning ? "Analysing…" : "Analyse IP"}
        </Button>
      </div>
    </ToolLayout>
  );
}
