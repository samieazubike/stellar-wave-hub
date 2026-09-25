"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";
import { useQuery } from "@tanstack/react-query";

interface ModeratedProject {
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";

interface PendingProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured: number;
  username: string | null;
  stellar_network?: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at?: string;
}

interface PendingPreview {
  stellar_network: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  username: string | null;
  created_at: string;
  in_scope: boolean;
}

interface ModeratedProject {
  id: number;
  name: string;
  slug: string;
  category: string;
  username: string | null;
  created_at: string;
}

interface OverviewResponse {
  pending_count: number;
  stats: {
    pending: number;
    approved: number;
    featured: number;
    rejected: number;
    delisted: number;
    total: number;
  };
  recently_moderated: ModeratedProject[];
  pending_preview: PendingPreview[];
}

function useMaintainerOverview(token: string | null) {
  return useQuery<OverviewResponse>({
    queryKey: ["maintainer-overview"],
    queryFn: async () => {
      const res = await fetch("/api/maintainer/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch overview");
      }
      return res.json();
    },
    enabled: !!token,
  });
}

function StatusBadge({ status, featured }: { status: string; featured?: number }) {
  const styles: Record<string, string> = {
    submitted: "tag-solar",
    approved: "tag-aurora",
    featured: "tag-nova",
    rejected: "bg-supernova/10 text-supernova border border-supernova/20",
    delisted: "bg-dust/50 text-ash border border-dust/30",
  };
  const label = featured ? "featured" : status;
  return <span className={`tag ${styles[label] || "tag-nova"} text-xs`}>{label}</span>;
}

function timeAgo(dateStr: string) {
  status: string;
  featured: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  can_moderate: boolean;
}

interface DashboardData {
  stats: {
    totalPending: number;
    scopedPending: number;
    totalApproved: number;
    totalRejected: number;
    totalFeatured: number;
    userRole: string;
    assignedCategories: string[];
    isFullAdmin: boolean;
  };
  pendingProjects: PendingProject[];
  recentlyModerated: ModeratedProject[];
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "recently";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MaintainerPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { data, isLoading, isError, error } = useMaintainerOverview(token);

  const isMaintainer = !!user && hasMinRole(user.role, "maintainer");

  // Loading auth
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-10 w-72 mb-3 rounded-xl" />
        <div className="skeleton h-4 w-96 mb-8 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
  return `${days}d ago`;
}

export default function MaintainerDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, loading: authLoading } = useAuth();
  const [filterScopeOnly, setFilterScopeOnly] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Authentication & Authorization checks
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRedirectCountdown(3);
      const timer = setTimeout(() => {
        router.replace("/login?redirect=/maintainer");
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (!hasMinRole(user.role, "maintainer")) {
      setRedirectCountdown(3);
      const timer = setTimeout(() => {
        router.replace("/explore");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router]);

  // Fetch maintainer dashboard data
  const {
    data,
    isLoading: dataLoading,
    isRefetching,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["maintainer-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/maintainer/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load maintainer dashboard");
      }
      return res.json();
    },
    enabled: !!token && !!user && hasMinRole(user.role, "maintainer"),
    refetchInterval: 30000,
  });

  // 1. Loading state
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="skeleton h-12 w-72 mb-4 rounded-xl" />
        <div className="skeleton h-6 w-96 mb-10 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Not signed in or not maintainer → sign-in required / access denied
  if (!user || !isMaintainer) {
    const isContributor = !!user && !isMaintainer;
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="glass rounded-2xl p-10 text-center max-w-md w-full animate-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-plasma/10 border border-plasma/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="1.6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">
            { !user ? "Sign in required" : "Maintainer access required" }
          </h2>
          <p className="text-ash text-sm mb-6 leading-relaxed">
            { !user
              ? "You need to sign in with a maintainer or admin account to view the maintainer dashboard."
              : isContributor
                ? "Your account is a contributor account. Ask an existing maintainer to grant you the maintainer role to access this dashboard."
                : "You do not have permission to view this page."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!user ? (
              <>
                <Link href="/login" className="btn-nova text-sm text-center">
                  Sign In
                </Link>
                <Link href="/register" className="btn-ghost text-sm text-center">
                  Create Account
                </Link>
              </>
            ) : (
              <>
                <Link href="/explore" className="btn-ghost text-sm text-center">
                  Back to Explore
                </Link>
                <Link href="/queue" className="btn-nova text-sm text-center">
                  View Public Queue
                </Link>
              </>
            )}
          </div>
          {!user && (
            <Link href="/explore" className="text-xs text-ash hover:text-moonlight mt-4 inline-block transition-colors">
              Continue as guest → Explore projects
            </Link>
  // 2. Unauthenticated: Sign-in required
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 sm:p-12 text-center max-w-md w-full border border-dust/50 shadow-2xl animate-in">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-solar/10 border border-solar/20 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--solar-bright)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-2xl text-starlight mb-2">
            Sign In Required
          </h2>
          <p className="text-ash text-sm mb-6 leading-relaxed">
            The Maintainer Dashboard is reserved for verified maintainers and administrators.
            Please sign in to moderate project submissions.
          </p>
          <div className="space-y-3">
            <Link
              href="/login?redirect=/maintainer"
              className="btn-nova w-full inline-flex justify-center items-center py-2.5"
            >
              Sign In to Continue
            </Link>
            <Link
              href="/explore"
              className="btn-ghost w-full inline-flex justify-center items-center py-2.5 text-sm"
            >
              Return to Explore
            </Link>
          </div>
          {redirectCountdown !== null && (
            <p className="text-xs text-ash/70 mt-4">
              Redirecting to sign-in in {redirectCountdown}s...
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3. Contributor role: Access denied & redirect
  if (!hasMinRole(user.role, "maintainer")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 sm:p-12 text-center max-w-md w-full border border-supernova/30 shadow-2xl animate-in">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-supernova/10 border border-supernova/20 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--supernova)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-2xl text-starlight mb-2">
            Maintainer Access Required
          </h2>
          <p className="text-ash text-sm mb-6 leading-relaxed">
            Your account role (<span className="text-solar capitalize">{user.role}</span>) does not have
            maintainer privileges. Check our maintainer guide if you are interested in community moderation.
          </p>
          <div className="space-y-3">
            <Link
              href="/explore"
              className="btn-nova w-full inline-flex justify-center items-center py-2.5"
            >
              Return to Explore
            </Link>
            <a
              href="https://github.com/samieazubike/stellar-wave-hub/blob/main/docs/MAINTAINERS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost w-full inline-flex justify-center items-center py-2.5 text-sm"
            >
              Read Maintainer Guide
            </a>
          </div>
          {redirectCountdown !== null && (
            <p className="text-xs text-ash/70 mt-4">
              Redirecting to Explore in {redirectCountdown}s...
            </p>
          )}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const pendingCount = data?.pending_count ?? 0;
  const recentlyModerated = data?.recently_moderated ?? [];
  const pendingPreview = data?.pending_preview ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma/30 to-nova/30 border border-plasma/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="2.5" />
                <path d="M12 13.5v2.5" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-starlight">Maintainer Dashboard</h1>
              <p className="text-ash text-sm mt-0.5">Overview of what needs moderation — quick actions for maintainers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/queue" className="btn-ghost text-sm !py-2 !px-3 hidden sm:inline-flex">
              Public Queue
            </Link>
            <Link href="/admin" className="btn-nova text-sm !py-2 !px-3 inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Open Admin Queue
            </Link>
          </div>
        </div>
        {user && (
          <p className="text-xs text-ash ml-[52px]">
            Signed in as <span className="text-moonlight font-medium">{user.username}</span>{" "}
            <span className="tag tag-plasma text-[10px] ml-1 align-middle">{user.role}</span>
          </p>
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm mb-6 animate-in">
          {(error as Error).message || "Failed to load overview"}
        </div>
      )}

      {/* Pending count hero + stats */}
      <div className="grid grid-cols-12 gap-4 mb-6 animate-in animate-in-delay-1">
        {/* Pending hero */}
        <div className="col-span-12 lg:col-span-5 glass rounded-2xl p-6 flex flex-col justify-between border-l-4 border-l-solar">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-ash mb-1">Pending review</p>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-bold text-5xl text-solar-bright leading-none">
                {isLoading ? "—" : pendingCount}
              </span>
              <span className="text-sm text-ash">
                project{pendingCount === 1 ? "" : "s"} awaiting moderation
              </span>
            </div>
            <p className="text-xs text-ash/70 mt-3 leading-relaxed">
              New submissions appear here as <span className="text-moonlight">submitted</span>. Claim them in the admin queue to approve, feature, or reject.
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            <Link
              href="/admin"
              className="btn-nova text-sm flex-1 text-center"
            >
              Review in Admin →
            </Link>
            <Link
              href="/queue"
              className="btn-ghost text-sm flex-1 text-center"
            >
              Public queue
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
          <div className="glass rounded-2xl p-5">
            <p className="text-2xl font-bold text-aurora-bright">{isLoading ? "—" : stats?.approved ?? 0}</p>
            <p className="text-xs text-ash uppercase tracking-wider mt-0.5">Approved</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-2xl font-bold text-nova-bright">{isLoading ? "—" : stats?.featured ?? 0}</p>
            <p className="text-xs text-ash uppercase tracking-wider mt-0.5">Featured</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-2xl font-bold text-plasma-bright">{isLoading ? "—" : stats?.total ?? 0}</p>
            <p className="text-xs text-ash uppercase tracking-wider mt-0.5">Total</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-2xl font-bold text-supernova/80">{isLoading ? "—" : stats?.rejected ?? 0}</p>
            <p className="text-xs text-ash uppercase tracking-wider mt-0.5">Rejected</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-2xl font-bold text-ash">{isLoading ? "—" : stats?.delisted ?? 0}</p>
            <p className="text-xs text-ash uppercase tracking-wider mt-0.5">Delisted</p>
          </div>
          <div className="glass rounded-2xl p-5 bg-plasma/5 border-plasma/15">
            <p className="text-sm font-semibold text-moonlight leading-tight">Quick links</p>
            <p className="text-xs text-ash mt-1">Jump to queue, explore, or revenue.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 animate-in animate-in-delay-2">
        {/* Pending preview */}
        <div className="col-span-12 lg:col-span-5">
          <div className="glass rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-starlight flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Pending preview
              </h3>
              <span className="text-xs text-ash">{pendingPreview.length} newest</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : pendingPreview.length > 0 ? (
              <div className="space-y-3">
                {pendingPreview.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.slug}`}
                    className="block bg-stardust/30 border border-dust/20 rounded-xl px-4 py-3 hover:border-plasma/30 hover:bg-stardust/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-starlight group-hover:text-plasma-bright transition-colors truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-ash mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="tag tag-nova text-[10px] !py-0 !px-2">{p.category}</span>
                          {p.username && <span>by {p.username}</span>}
                          <span>{timeAgo(p.created_at)}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-plasma/60 group-hover:text-plasma-bright transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
                <Link href="/admin" className="block text-center text-xs text-plasma-bright hover:text-starlight transition-colors mt-2">
                  View all pending in Admin →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-aurora/10 border border-aurora/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--aurora-bright)" strokeWidth="1.6">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm text-moonlight font-medium">All caught up</p>
                <p className="text-xs text-ash mt-1">No projects pending review</p>
  const pendingProjects = data?.pendingProjects || [];
  const recentlyModerated = data?.recentlyModerated || [];

  const displayedPending = filterScopeOnly
    ? pendingProjects.filter((p) => p.in_scope)
    : pendingProjects;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Header Banner */}
      <div className="glass rounded-3xl p-6 sm:p-8 mb-8 border border-dust/40 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-starlight tracking-tight">
                Maintainer Dashboard
              </h1>
              <span
                className={`tag text-xs font-semibold uppercase px-3 py-1 ${
                  user.role === "admin"
                    ? "bg-solar/15 text-solar-bright border border-solar/30"
                    : "bg-nova/20 text-nova-bright border border-nova/30"
                }`}
              >
                {user.role === "admin" ? "Administrator" : "Maintainer"}
              </span>
            </div>
            <p className="text-ash text-sm sm:text-base max-w-2xl">
              Triage community submissions, monitor active moderation status, and review ecosystem projects.
            </p>

            {/* Category scopes */}
            {stats && (
              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                <span className="text-ash font-medium">Assigned Moderation Scope:</span>
                {stats.isFullAdmin ? (
                  <span className="tag bg-aurora/10 text-aurora-bright border border-aurora/20">
                    All Categories (Full Scope)
                  </span>
                ) : stats.assignedCategories.length > 0 ? (
                  stats.assignedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="tag bg-nova/10 text-nova-bright border border-nova/20 uppercase"
                    >
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="tag bg-ash/10 text-ash border border-ash/20">
                    General Review
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ["maintainer-dashboard"] });
              }}
              disabled={dataLoading || isRefetching}
              className="btn-ghost text-sm inline-flex items-center gap-2 !py-2 !px-4"
              title="Refresh dashboard"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isRefetching ? "animate-spin text-nova-bright" : ""}
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
            </button>

            {user.role === "admin" && (
              <Link
                href="/admin"
                className="btn-nova text-sm inline-flex items-center gap-2 !py-2 !px-4"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-in animate-in-delay-1">
        {/* Pending Submissions */}
        <div className="glass rounded-2xl p-5 border border-solar/30 relative overflow-hidden group hover:border-solar/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-solar-bright">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-solar/15 flex items-center justify-center text-solar-bright">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl sm:text-4xl text-starlight">
              {stats?.totalPending ?? 0}
            </span>
            {stats && !stats.isFullAdmin && (
              <span className="text-xs text-solar font-medium">
                ({stats.scopedPending} in your scope)
              </span>
            )}
          </div>
          <p className="text-xs text-ash mt-1">Awaiting maintainer verification</p>
        </div>

        {/* Recently Moderated */}
        <div className="glass rounded-2xl p-5 border border-plasma/30 relative overflow-hidden group hover:border-plasma/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-plasma-bright">
              Recently Moderated
            </span>
            <div className="w-8 h-8 rounded-xl bg-plasma/15 flex items-center justify-center text-plasma-bright">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl sm:text-4xl text-starlight">
              {recentlyModerated.length}
            </span>
            <span className="text-xs text-ash">latest actions</span>
          </div>
          <p className="text-xs text-ash mt-1">Recent approval & rejection history</p>
        </div>

        {/* Approved Submissions */}
        <div className="glass rounded-2xl p-5 border border-aurora/30 relative overflow-hidden group hover:border-aurora/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-aurora-bright">
              Approved Projects
            </span>
            <div className="w-8 h-8 rounded-xl bg-aurora/15 flex items-center justify-center text-aurora-bright">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl sm:text-4xl text-starlight">
              {stats?.totalApproved ?? 0}
            </span>
            {stats && stats.totalFeatured > 0 && (
              <span className="text-xs text-nova-bright font-medium">
                ({stats.totalFeatured} featured)
              </span>
            )}
          </div>
          <p className="text-xs text-ash mt-1">Active in ecosystem showcase</p>
        </div>

        {/* Rejections */}
        <div className="glass rounded-2xl p-5 border border-dust/40 relative overflow-hidden group hover:border-dust/70 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ash">
              Rejected / Delisted
            </span>
            <div className="w-8 h-8 rounded-xl bg-supernova/10 flex items-center justify-center text-supernova">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl sm:text-4xl text-starlight">
              {stats?.totalRejected ?? 0}
            </span>
            <span className="text-xs text-ash">records</span>
          </div>
          <p className="text-xs text-ash mt-1">Submissions needing adjustments</p>
        </div>
      </div>

      {/* Quick Links Row */}
      <div className="glass rounded-2xl p-6 mb-8 border border-dust/40 animate-in animate-in-delay-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-moonlight mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Quick Links & Resources
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/queue"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-nova/40 transition-all text-center group"
          >
            <div className="w-8 h-8 rounded-lg bg-solar/15 flex items-center justify-center text-solar-bright mb-2 group-hover:scale-110 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-starlight group-hover:text-nova-bright">
              Approval Queue
            </span>
            <span className="text-[10px] text-ash mt-0.5">Public Queue</span>
          </Link>

          <Link
            href="/explore"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-nova/40 transition-all text-center group"
          >
            <div className="w-8 h-8 rounded-lg bg-plasma/15 flex items-center justify-center text-plasma-bright mb-2 group-hover:scale-110 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-starlight group-hover:text-nova-bright">
              Explore Projects
            </span>
            <span className="text-[10px] text-ash mt-0.5">Active Directory</span>
          </Link>

          <Link
            href="/submit"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-nova/40 transition-all text-center group"
          >
            <div className="w-8 h-8 rounded-lg bg-aurora/15 flex items-center justify-center text-aurora-bright mb-2 group-hover:scale-110 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-starlight group-hover:text-nova-bright">
              Submit Project
            </span>
            <span className="text-[10px] text-ash mt-0.5">New Wave Item</span>
          </Link>

          <a
            href="https://github.com/samieazubike/stellar-wave-hub/blob/main/docs/MAINTAINERS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-nova/40 transition-all text-center group"
          >
            <div className="w-8 h-8 rounded-lg bg-nova/20 flex items-center justify-center text-nova-bright mb-2 group-hover:scale-110 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-starlight group-hover:text-nova-bright">
              Maintainer Guide
            </span>
            <span className="text-[10px] text-ash mt-0.5">Checklist & Rules</span>
          </a>

          {user.role === "admin" ? (
            <>
              <Link
                href="/admin"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-solar/40 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-solar/15 flex items-center justify-center text-solar-bright mb-2 group-hover:scale-110 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-starlight group-hover:text-solar-bright">
                  Admin Panel
                </span>
                <span className="text-[10px] text-ash mt-0.5">Full Moderation</span>
              </Link>

              <Link
                href="/admin/revenue"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-aurora/40 transition-all text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-aurora/15 flex items-center justify-center text-aurora-bright mb-2 group-hover:scale-110 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-starlight group-hover:text-aurora-bright">
                  Revenue Analytics
                </span>
                <span className="text-[10px] text-ash mt-0.5">On-chain Treasury</span>
              </Link>
            </>
          ) : (
            <Link
              href="/blogs"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-stardust/40 hover:bg-stardust/80 border border-dust/30 hover:border-nova/40 transition-all text-center group"
            >
              <div className="w-8 h-8 rounded-lg bg-comet/15 flex items-center justify-center text-comet mb-2 group-hover:scale-110 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-starlight group-hover:text-nova-bright">
                Wave Blog
              </span>
              <span className="text-[10px] text-ash mt-0.5">Updates & Articles</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: What Needs Moderation (Pending Queue) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass rounded-2xl p-6 border border-dust/40">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-solar animate-pulse" />
                <h2 className="font-semibold text-lg text-starlight">
                  Needs Moderation
                </h2>
                <span className="tag bg-solar/15 text-solar-bright border border-solar/30 text-xs">
                  {displayedPending.length}
                </span>
              </div>

              {stats && !stats.isFullAdmin && stats.assignedCategories.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterScopeOnly(false)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      !filterScopeOnly
                        ? "bg-stardust text-starlight font-medium"
                        : "text-ash hover:text-moonlight"
                    }`}
                  >
                    All ({pendingProjects.length})
                  </button>
                  <button
                    onClick={() => setFilterScopeOnly(true)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      filterScopeOnly
                        ? "bg-solar/20 text-solar-bright font-medium border border-solar/30"
                        : "text-ash hover:text-moonlight"
                    }`}
                  >
                    In My Scope ({stats.scopedPending})
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            {dataLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-xl" />
                ))}
              </div>
            ) : displayedPending.length > 0 ? (
              <div className="space-y-3">
                {displayedPending.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-cosmos/60 border border-dust/30 hover:border-dust/60 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-starlight text-base">
                            {project.name}
                          </span>
                          <span className="tag tag-nova text-[11px] uppercase">
                            {project.category}
                          </span>
                          <span
                            className={`tag text-[10px] ${
                              project.stellar_network === "testnet"
                                ? "bg-solar/10 text-solar-bright border border-solar/20"
                                : "bg-aurora/10 text-aurora-bright border border-aurora/20"
                            }`}
                          >
                            {project.stellar_network}
                          </span>
                          {project.in_scope && (
                            <span className="tag bg-aurora/15 text-aurora-bright border border-aurora/30 text-[10px]">
                              In Your Scope
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-moonlight/80 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dust/20 text-xs text-ash flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {project.username && (
                          <span>
                            by <span className="text-moonlight">{project.username}</span>
                          </span>
                        )}
                        <span>{timeAgo(project.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ash hover:text-starlight text-xs flex items-center gap-1 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Code
                          </a>
                        )}
                        <Link
                          href="/queue"
                          className="text-xs text-solar hover:text-solar-bright font-medium transition-colors"
                        >
                          View in Queue &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-aurora/10 border border-aurora/20 flex items-center justify-center text-aurora-bright">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-semibold text-moonlight text-base mb-1">
                  All caught up!
                </h3>
                <p className="text-ash text-xs">
                  {filterScopeOnly
                    ? "No pending submissions in your assigned categories right now."
                    : "No submissions are currently waiting for moderation review."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recently moderated */}
        <div className="col-span-12 lg:col-span-7">
          <div className="glass rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-starlight flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nova-bright)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Recently moderated
              </h3>
              <Link href="/admin" className="text-xs text-ash hover:text-moonlight transition-colors">
                Open Admin
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : recentlyModerated.length > 0 ? (
              <div className="space-y-2">
                {recentlyModerated.map((p) => (
                  <Link
                    key={`${p.id}-${p.updated_at ?? p.created_at}`}
                    href={`/projects/${p.slug}`}
                    className="flex items-center gap-3 bg-stardust/20 border border-dust/20 rounded-xl px-4 py-3 hover:border-nova/25 hover:bg-stardust/40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-medium text-sm text-starlight group-hover:text-nova-bright transition-colors truncate">
                          {p.name}
                        </span>
                        <StatusBadge status={p.status} featured={p.featured} />
                        <span className="tag text-[10px] bg-stardust/50 text-ash border border-dust/20 !py-0 !px-2">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ash flex-wrap">
                        {p.username && <span>by {p.username}</span>}
                        {p.updated_at && <span>{timeAgo(p.updated_at)}</span>}
                        {p.rejection_reason && (
                          <span className="text-supernova/60 italic truncate max-w-[180px]">{p.rejection_reason}</span>
                        )}
                      </div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-ash group-hover:text-nova-bright transition-colors"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-stardust/50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm text-moonlight font-medium">No moderation history yet</p>
                <p className="text-xs text-ash mt-1">Approved, rejected, and delisted projects will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 animate-in animate-in-delay-3">
        <h3 className="font-semibold text-starlight mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M13 2 L13 12 L18 12" />
            <path d="M16 8 L8 16" />
          </svg>
          Quick links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin"
            className="glass rounded-2xl p-5 hover:border-plasma/30 hover:bg-stardust/70 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-plasma/15 border border-plasma/20 flex items-center justify-center mb-3 group-hover:bg-plasma/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <p className="font-medium text-sm text-starlight">Moderate in Admin</p>
            <p className="text-xs text-ash mt-1">Approve, feature, reject, delist</p>
          </Link>

          <Link
            href="/queue"
            className="glass rounded-2xl p-5 hover:border-solar/25 hover:bg-stardust/70 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-solar/15 border border-solar/20 flex items-center justify-center mb-3 group-hover:bg-solar/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="font-medium text-sm text-starlight">Public queue</p>
            <p className="text-xs text-ash mt-1">What contributors see awaiting review</p>
          </Link>

          <Link
            href="/explore"
            className="glass rounded-2xl p-5 hover:border-nova/25 hover:bg-stardust/70 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-nova/15 border border-nova/20 flex items-center justify-center mb-3 group-hover:bg-nova/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nova-bright)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="font-medium text-sm text-starlight">Explore projects</p>
            <p className="text-xs text-ash mt-1">Live directory of approved & featured</p>
          </Link>

          <a
            href="https://github.com/samieazubike/stellar-wave-hub/blob/main/docs/MAINTAINERS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-2xl p-5 hover:border-dust/40 hover:bg-stardust/70 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-stardust/60 border border-dust/30 flex items-center justify-center mb-3 group-hover:bg-stardust/80 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--moonlight)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="font-medium text-sm text-starlight">Maintainer guide</p>
            <p className="text-xs text-ash mt-1">Checklist & permission matrix</p>
          </a>
        </div>

        {hasMinRole(user.role, "admin") && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/revenue"
              className="glass rounded-xl px-4 py-3 flex items-center justify-between hover:border-aurora/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-aurora/10 border border-aurora/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--aurora-bright)" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-moonlight group-hover:text-starlight">Revenue dashboard</span>
              </div>
              <span className="text-ash group-hover:text-moonlight">→</span>
            </Link>
            <Link
              href="/admin"
              className="glass rounded-xl px-4 py-3 flex items-center justify-between hover:border-nova/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nova-bright)" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-moonlight group-hover:text-starlight">Contract tab (admin)</span>
              </div>
              <span className="text-ash group-hover:text-moonlight">→</span>
            </Link>
          </div>
        )}
        {/* Right Column: Recently Moderated History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass rounded-2xl p-6 border border-dust/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-starlight flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--plasma)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Recently Moderated
              </h2>
              <span className="text-xs text-ash">Audit feed</span>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : recentlyModerated.length > 0 ? (
              <div className="space-y-3">
                {recentlyModerated.map((item) => {
                  const isApproved = item.status === "approved" || item.status === "featured";
                  const isRejected = item.status === "rejected" || item.status === "delisted";

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-cosmos/60 border border-dust/20 hover:border-dust/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${item.slug}`}
                            className="font-medium text-sm text-starlight hover:text-nova-bright transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[11px] text-ash uppercase">
                            {item.category}
                          </span>
                        </div>

                        <span
                          className={`tag text-[10px] shrink-0 font-medium ${
                            item.status === "featured"
                              ? "bg-nova/20 text-nova-bright border border-nova/30"
                              : isApproved
                              ? "bg-aurora/15 text-aurora-bright border border-aurora/30"
                              : "bg-supernova/15 text-supernova border border-supernova/30"
                          }`}
                        >
                          {item.status === "featured"
                            ? "Featured"
                            : isApproved
                            ? "Approved"
                            : item.status === "delisted"
                            ? "Delisted"
                            : "Rejected"}
                        </span>
                      </div>

                      {item.rejection_reason && (
                        <p className="text-[11px] text-supernova/90 bg-supernova/5 p-2 rounded-lg border border-supernova/15 line-clamp-2">
                          Note: {item.rejection_reason}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-ash/80 pt-1">
                        <span>
                          {item.username ? `by ${item.username}` : "Submitter"}
                        </span>
                        <span>{timeAgo(item.updated_at || item.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-ash text-xs">No moderation history recorded yet.</p>
              </div>
            )}
          </div>

          {/* Maintainer Checklist Box */}
          <div className="glass rounded-2xl p-5 border border-dust/40 text-xs text-ash space-y-2.5">
            <h3 className="font-semibold text-moonlight text-sm flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Review Checklist Reminders
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-ash/90">
              <li>Confirm project is genuinely part of Stellar Wave Program</li>
              <li>Verify GitHub repo and public demo links resolve</li>
              <li>Confirm Stellar Account or Soroban Contract ID is valid</li>
              <li>Provide clear reasons if rejecting or delisting submissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
