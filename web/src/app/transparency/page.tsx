"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleAlert,
  Coins,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  getProjectRatingOnChain,
  getProjectsOnChain,
  getRatingFee,
  getRegistrationFee,
  getTreasuryBalance,
  ON_CHAIN_ENABLED,
} from "@/lib/ratingContract";

interface TransparencyData {
  projects: string[] | null;
  ratings: number | null;
  ratingFee: bigint | null;
  registrationFee: bigint | null;
  treasury: bigint | null;
}

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
const NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
const EXPLORER_BASE =
  NETWORK === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

const EMPTY_DATA: TransparencyData = {
  projects: null,
  ratings: null,
  ratingFee: null,
  registrationFee: null,
  treasury: null,
};

const USDC_UNIT = BigInt(1_000_000);

function formatUsdc(amount: bigint | null): string {
  if (amount === null) return "—";
  const whole = amount / USDC_UNIT;
  const fraction = (amount % USDC_UNIT)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${whole.toLocaleString()}${fraction ? `.${fraction}` : ""}`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <article className="glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15">
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.08] blur-2xl ${accent}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ash">
            {label}
          </p>
          <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-starlight sm:text-4xl">
            {value}
          </p>
          <p className="mt-2 text-sm text-ash">{detail}</p>
        </div>
        <span className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-moonlight">
          <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

/** Read every public contract value; individual failures are reported, not thrown. */
async function loadTransparencyData(): Promise<{data: TransparencyData; errors: string[]}> {
  const nextErrors: string[] = [];
  const [projectsResult, ratingFeeResult, registrationFeeResult, treasuryResult] =
    await Promise.allSettled([
      getProjectsOnChain(),
      getRatingFee(),
      getRegistrationFee(),
      getTreasuryBalance(),
    ]);

  const projects =
    projectsResult.status === "fulfilled" ? projectsResult.value : null;
  if (projectsResult.status === "rejected" || projects === null) {
    nextErrors.push("project registry");
  }
  if (
    ratingFeeResult.status === "rejected" ||
    ratingFeeResult.value === null
  )
    nextErrors.push("rating fee");
  if (
    registrationFeeResult.status === "rejected" ||
    registrationFeeResult.value === null
  )
    nextErrors.push("registration fee");
  if (
    treasuryResult.status === "rejected" ||
    treasuryResult.value === null
  )
    nextErrors.push("treasury balance");

  let ratings: number | null = projects === null ? null : 0;
  if (projects) {
    const ratingResults = await Promise.allSettled(
      projects.map((project) => getProjectRatingOnChain(project)),
    );
    let total = 0;
    let ratingsAvailable = true;
    for (const result of ratingResults) {
      if (result.status === "rejected" || result.value === null) {
        ratingsAvailable = false;
        continue;
      }
      total += result.value.count;
    }
    ratings = ratingsAvailable ? total : null;
    if (!ratingsAvailable) nextErrors.push("on-chain ratings");
  }

  return {
    errors: nextErrors,
    data: {
    projects,
    ratings,
    ratingFee:
      ratingFeeResult.status === "fulfilled" ? ratingFeeResult.value : null,
    registrationFee:
      registrationFeeResult.status === "fulfilled"
        ? registrationFeeResult.value
        : null,
    treasury:
      treasuryResult.status === "fulfilled" ? treasuryResult.value : null,
    },
  };
}

export default function TransparencyPage() {
  const query = useQuery({
    queryKey: ["transparency"],
    queryFn: loadTransparencyData,
    enabled: ON_CHAIN_ENABLED,
  });
  const data = query.data?.data ?? EMPTY_DATA;
  const errors = query.data?.errors ?? [];
  const loading = ON_CHAIN_ENABLED && query.isFetching;
  const hasLoaded = !ON_CHAIN_ENABLED || query.isFetched;
  const refresh = () => query.refetch();

  const networkName = NETWORK === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet";

  return (
    <div className="relative isolate min-h-[70vh] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.12),transparent_62%)]"
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="animate-in relative mb-12 overflow-hidden rounded-3xl border border-white/[0.08] bg-nebula/65 px-6 py-8 sm:px-10 sm:py-11">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-plasma/10 shadow-[0_0_0_28px_rgba(6,182,212,0.025),0_0_0_56px_rgba(6,182,212,0.02)]"
          />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-aurora/20 bg-aurora/[0.06] px-3 py-1.5 text-xs font-medium tracking-wide text-aurora-bright">
              <ShieldCheck size={14} aria-hidden="true" />
              OPEN BY DESIGN
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-starlight sm:text-5xl">
              The numbers{" "}
              <span className="text-gradient-nova">on-chain.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-moonlight sm:text-lg">
              A clear view of the contract that powers project ratings: its fees,
              registered projects, ratings, and treasury. Every figure below is
              read directly from Stellar.
            </p>
          </div>
        </header>

        {!ON_CHAIN_ENABLED ? (
          <section
            className="glass animate-in rounded-2xl border border-solar/20 p-6 sm:p-8"
            aria-live="polite"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-solar/10 p-3 text-solar-bright">
                <CircleAlert size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-starlight">
                  On-chain data is not configured
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-moonlight">
                  Live contract statistics will appear here once{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-plasma-bright">
                    NEXT_PUBLIC_CONTRACT_ID
                  </code>{" "}
                  is set for this deployment. No figures are estimated or
                  substituted.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section aria-label="Live contract metrics">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      loading
                        ? "animate-pulse bg-solar-bright"
                        : errors.length
                          ? "bg-solar-bright"
                          : "bg-aurora-bright shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    }`}
                  />
                  <p className="text-sm font-medium text-moonlight" aria-live="polite">
                    {loading
                      ? "Reading from Stellar…"
                      : errors.length
                        ? "Some on-chain data is unavailable"
                        : "Live contract data"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3 py-2 text-xs font-medium text-moonlight transition hover:border-white/20 hover:text-starlight disabled:cursor-wait disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              </div>
              {errors.length > 0 && (
                <p className="mb-5 rounded-xl border border-solar/15 bg-solar/[0.04] px-4 py-3 text-sm text-moonlight">
                  Could not read {errors.join(", ")}. Other values shown are live;
                  unavailable figures are left blank.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Star}
                  label="On-chain ratings"
                  value={
                    loading && !hasLoaded
                      ? "…"
                      : data.ratings === null
                        ? "—"
                        : data.ratings.toLocaleString()
                  }
                  detail="Across registered projects"
                  accent="bg-plasma-bright"
                />
                <MetricCard
                  icon={Coins}
                  label="Rating fee"
                  value={
                    loading && !hasLoaded
                      ? "…"
                      : data.ratingFee === null
                        ? "—"
                        : formatUsdc(data.ratingFee)
                  }
                  detail="USDC per rating"
                  accent="bg-nova-bright"
                />
                <MetricCard
                  icon={ArrowUpRight}
                  label="Registration fee"
                  value={
                    loading && !hasLoaded
                      ? "…"
                      : data.registrationFee === null
                        ? "—"
                        : formatUsdc(data.registrationFee)
                  }
                  detail="USDC per project"
                  accent="bg-solar-bright"
                />
                <MetricCard
                  icon={Database}
                  label="Treasury balance"
                  value={
                    loading && !hasLoaded
                      ? "…"
                      : data.treasury === null
                        ? "—"
                        : formatUsdc(data.treasury)
                  }
                  detail="USDC held by the contract"
                  accent="bg-aurora-bright"
                />
              </div>
            </section>

            <section className="glass mt-6 overflow-hidden rounded-2xl">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="rounded-xl border border-plasma/15 bg-plasma/[0.07] p-3 text-plasma-bright">
                    <Activity size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ash">
                      Registry contract
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-starlight sm:text-base">
                      {CONTRACT_ID || "Contract ID unavailable"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-moonlight">
                    <span className="h-1.5 w-1.5 rounded-full bg-plasma-bright" />
                    {networkName}
                  </span>
                  {CONTRACT_ID && (
                    <a
                      href={`${EXPLORER_BASE}/contract/${CONTRACT_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-plasma/[0.09] px-3 py-2 text-xs font-medium text-plasma-bright transition hover:bg-plasma/[0.16]"
                    >
                      View on Stellar Expert
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] px-6 py-4 text-xs text-ash sm:px-7">
                <span className="inline-flex items-center gap-2">
                  {errors.length === 0 && hasLoaded ? (
                    <Check size={14} className="text-aurora-bright" aria-hidden="true" />
                  ) : (
                    <CircleAlert
                      size={14}
                      className={errors.length ? "text-solar-bright" : "text-ash"}
                      aria-hidden="true"
                    />
                  )}
                  {loading
                    ? "Checking contract"
                    : errors.length
                      ? "Partial data"
                      : "Registry responding"}
                </span>
                <span>
                  Registered projects:{" "}
                  <span className="font-medium text-moonlight">
                    {data.projects === null
                      ? "—"
                      : data.projects.length.toLocaleString()}
                  </span>
                </span>
              </div>
            </section>
          </>
        )}

        <footer className="mt-8 flex items-start gap-3 border-t border-white/[0.06] pt-5 text-xs leading-5 text-ash">
          <ExternalLink size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Contract details and ledger activity can be independently verified
            with Stellar Expert.{" "}
            <a
              href="https://stellar.expert/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-moonlight underline decoration-white/20 underline-offset-4 transition hover:text-starlight"
            >
              Open explorer
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
