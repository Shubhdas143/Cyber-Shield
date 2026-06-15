import { useState } from "react";
import { Image as ImageIcon, MapPin, Camera, ExternalLink } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { ToolLayout, ResultArea } from "@/components/ToolLayout";
import { CaseSelect } from "@/components/CaseSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ExifGrid({ meta }) {
  if (!meta) return null;
  const t = meta.exif || {};
  const info = meta.info || {};
  const coords = meta.coords;
  const cells = [
    ["Format", info.format || "—"],
    ["Dimensions", info.size || "—"],
    ["Camera Make", t.Make || "—"],
    ["Camera Model", t.Model || "—"],
    ["Date Taken", t.DateTimeOriginal || t.DateTime || "—"],
    ["Software", t.Software || "—"],
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
        <Camera size={12} /> Metadata
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-[var(--cs-radius-sm)] border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
            <div className="text-[9.5px] uppercase tracking-wide text-[var(--cs-muted)]">{k}</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-[#6EE7B7]" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>
      {coords ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[var(--cs-radius-sm)] border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] px-3 py-2" data-testid="exif-gps">
          <div className="flex items-center gap-2 text-[#FCD34D]">
            <MapPin size={14} />
            <span className="font-mono text-xs">{coords.latitude}, {coords.longitude}</span>
          </div>
          <a href={coords.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[var(--cs-primary-2)] hover:underline">
            Open in Maps <ExternalLink size={11} />
          </a>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--cs-muted)]">No GPS coordinates embedded {meta.has_exif ? "" : "· no EXIF metadata present"}.</p>
      )}
    </div>
  );
}

export default function ExifForensics() {
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!file) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (caseId) fd.append("case_id", caseId);
      const { data } = await api.post("/tools/exif-forensics", fd);
      setResult(data);
    } catch (e) { setError(apiError(e, "EXIF extraction failed")); }
    finally { setScanning(false); }
  };

  return (
    <ToolLayout toolId="exif-forensics" result={
      <ResultArea scanning={scanning} error={error} result={result}
        extra={result && <ExifGrid meta={result?.meta} />}
        scanLabel="Extracting & analysing metadata…"
        emptyIcon={ImageIcon} emptyTitle="No image analysed yet"
        emptyHint="Upload a photo to extract GPS, camera and edit metadata for investigative leads." />
    }>
      <div className="rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--cs-muted)]">Image File (JPEG / TIFF / PNG)</Label>
          <Input type="file" accept="image/*" data-testid="exif-file-input" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer border-[var(--cs-border)] bg-[var(--cs-surface-2)] text-sm text-[var(--cs-text)] file:mr-3 file:rounded file:border-0 file:bg-[var(--cs-primary)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black" />
          {file && <p className="text-[11px] text-[var(--cs-muted)]">{file.name} · {(file.size / 1024).toFixed(2)} KB</p>}
          <p className="pt-1 text-[10.5px] text-[var(--cs-muted)]">JPEG photos from cameras/phones carry the richest EXIF (GPS, device). Note: many social platforms strip metadata on upload.</p>
        </div>
        <CaseSelect value={caseId} onChange={setCaseId} />
        <Button onClick={run} disabled={scanning || !file} data-testid="tool-analyze-button"
          className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
          <Camera size={15} className="mr-2" /> {scanning ? "Analysing…" : "Extract Metadata"}
        </Button>
      </div>
    </ToolLayout>
  );
}
