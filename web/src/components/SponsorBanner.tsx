"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface CategorySponsor {
  id: string;
  name: string;
  logoUrl: string;
  tagline?: string;
  link: string;
}

export interface SponsorBannerProps {
  category: string;
  /** Optionally provided by the parent to avoid a fetch on the client. */
  sponsor?: CategorySponsor | null;
  /** URL for the "Sponsor this category" link when there is no sponsor. */
  sponsorUrl?: string;
}

interface FetchState {
  status: "idle" | "loading" | "loaded" | "error";
  sponsor: CategorySponsor | null;
}

function isCategorySponsor(value: unknown): value is CategorySponsor {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.logoUrl === "string" &&
    typeof candidate.link === "string" &&
    (candidate.tagline === undefined || typeof candidate.tagline === "string")
  );
}

export default function SponsorBanner({
  category,
  sponsor: sponsorProp,
  sponsorUrl = "https://github.com/sponsors",
}: SponsorBannerProps) {
  const hasProp = sponsorProp !== undefined;
  const [state, setState] = useState<FetchState>({
    status: hasProp ? "loaded" : "idle",
    sponsor: sponsorProp ?? null,
  });

  useEffect(() => {
    if (hasProp) {
      setState({ status: "loaded", sponsor: sponsorProp ?? null });
      return;
    }

    if (!category) {
      setState({ status: "loaded", sponsor: null });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", sponsor: null });

    async function load() {
      try {
        const res = await fetch(`/api/sponsors/category/${encodeURIComponent(category)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (res.status === 404) {
          setState({ status: "loaded", sponsor: null });
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch sponsor (${res.status})`);
        }

        const data: unknown = await res.json();
        const candidate =
          data && typeof data === "object" && "sponsor" in (data as Record<string, unknown>)
            ? (data as Record<string, unknown>).sponsor
            : data;

        setState({
          status: "loaded",
          sponsor: isCategorySponsor(candidate) ? candidate : null,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", sponsor: null });
      }
    }

    void load();
    return () => controller.abort();
  }, [category, hasProp, sponsorProp]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <aside aria-busy="true" aria-label="Loading category sponsor" className="my-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
        <div className="h-x w-12 rounded bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-200" />
      </aside>
    );
  }

  if (state.status === "error") {
    return null;
  }

 const sponsor = state.sponsor;

 if (!sponsor) {
    return (
      <aside
        aria-label="Sponsorship opportunity"
        className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
      >
        <span className="text-sm text-gray-600">
          No sponsor for this category yet.
        </span>
        <Link
          href={sponsorUrl}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Sponsor this category
        </Link>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Sponsored category banner"
      className="my-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Sponsored
      </span>
      <Link href={sponsor.link} className="flex items-center gap-3">
        {sponsor.logoUrl ? (
          <Image
            src={sponsor.logoUrl}
            alt={`${sponsor.name} logo`}
            width={40}
            height={40}
            className="h-10 w-10 rounded object-contain"
          />
        ) : null}
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{sponsor.name}</span>
          {sponsor.tagline ? (
            <span className="text-sm text-gray-600">{sponsor.tagline}</span>
          ) : null}
        </span>
      </Link>
    </aside>
  );
}
