"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const QR_OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2, width: 512 };

function fileSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

/** QR code for a project URL with PNG / SVG downloads (event booths, slides). */
export default function ProjectQr({ url, name }: { url: string; name: string }) {
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([QRCode.toDataURL(url, QR_OPTIONS), QRCode.toString(url, { ...QR_OPTIONS, type: "svg" })])
      .then(([png, svgText]) => {
        if (cancelled) return;
        setPngUrl(png);
        setSvg(svgText);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, open]);

  const downloadSvg = () => {
    if (!svg) return;
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(blobUrl, `${fileSlug(name)}-qr.svg`);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost text-sm inline-flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
        </svg>
        QR code
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 inline-flex flex-col items-center gap-3">
      {pngUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser
        <img src={pngUrl} alt={`QR code linking to ${name}`} width={160} height={160} className="rounded-lg bg-white" />
      ) : (
        <div className="skeleton h-40 w-40 rounded-lg" />
      )}
      <p className="max-w-[12rem] truncate text-xs text-ash" title={url}>{url}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => pngUrl && download(pngUrl, `${fileSlug(name)}-qr.png`)}
          disabled={!pngUrl}
          className="btn-nova !py-1.5 text-xs disabled:opacity-50"
        >
          Download PNG
        </button>
        <button type="button" onClick={downloadSvg} disabled={!svg} className="btn-ghost !py-1.5 text-xs disabled:opacity-50">
          Download SVG
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost !py-1.5 text-xs">
          Hide
        </button>
      </div>
    </div>
  );
}
