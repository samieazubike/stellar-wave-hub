"use client";

import { useEffect, useState } from "react";

export interface HeroSponsor {
  id: string;
  name: string;
  url: string;
  logoUrl?: string | null;
  weekStart: string;
  weekEnd: string;
}

export default function HeroSponsorStrip() {
  const [sponsor, setSponsor] = useState<HeroSponsor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sponsors/current", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setSponsor(null);
          return;
        }
        const data = (await res.json()) as { sponsor: HeroSponsor | null };
        if (!cancelled) setSponsor(data.sponsor ?? null);
      } catch {
        if (!cancelled) setSponsor(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !sponsor) return null;

  return (
    <div
      className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/60"
      aria-label="Sponsored"
    >
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        Sponsored
      </span>
      <a
        href={sponsor.url}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
      >
        {sponsor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logoUrl} alt="" className="h-5 w-auto rounded" />
        ) : null}
        <span>{sponsor.name}</span>
      </a>
    </div>
  );
}
