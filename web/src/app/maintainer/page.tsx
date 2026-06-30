"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ModerationStats {
  pendingCount: number;
  recentlyModerated: Array<{
    id: number;
    name: string;
    slug: string;
    status: string;
    moderatedAt: string;
    moderatedBy: string;
  }>;
  totalProjects: number;
  totalUsers: number;
}

export default function MaintainerPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/maintainer");
      return;
    }

    // Check role from token payload (client-side decode without verification)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "maintainer" && payload.role !== "admin") {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/login?redirect=/maintainer");
      return;
    }

    // Fetch moderation stats
    fetch("/api/maintainer/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 403) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            This page is restricted to maintainers and administrators.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="animate-spin">⟳</span>
          <span>Loading maintainer dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Maintainer Dashboard</h1>
          <p className="text-slate-400">
            Overview of projects awaiting moderation and recent activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Pending Card */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Pending Review</span>
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {stats?.pendingCount ?? 0}
            </div>
            <p className="text-slate-500 text-sm">Projects awaiting approval</p>
            {stats && stats.pendingCount > 0 && (
              <a
                href="/queue"
                className="inline-flex items-center gap-2 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Go to moderation queue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>
            )}
          </div>

          {/* Total Projects */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Total Projects</span>
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M12 2 2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {stats?.totalProjects ?? 0}
            </div>
            <p className="text-slate-500 text-sm">All-time submissions</p>
          </div>

          {/* Total Users */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Contributors</span>
              <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {stats?.totalUsers ?? 0}
            </div>
            <p className="text-slate-500 text-sm">Registered users</p>
          </div>
        </div>

        {/* Recently Moderated */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recently Moderated</h2>
            <a
              href="/admin"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View full admin panel →
            </a>
          </div>

          {stats?.recentlyModerated && stats.recentlyModerated.length > 0 ? (
            <div className="space-y-3">
              {stats.recentlyModerated.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        project.status === "approved"
                          ? "bg-emerald-400"
                          : project.status === "rejected"
                          ? "bg-red-400"
                          : "bg-amber-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-white">{project.name}</p>
                      <p className="text-sm text-slate-500">
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)} by{" "}
                        {project.moderatedBy} on{" "}
                        {new Date(project.moderatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/projects/${project.slug}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>No projects have been moderated yet.</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {[
            { label: "Moderation Queue", href: "/queue", icon: "📝" },
            { label: "Admin Panel", href: "/admin", icon: "⚙️" },
            { label: "Explore Projects", href: "/explore", icon: "🔍" },
            { label: "Submit Project", href: "/submit", icon: "➕" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium text-white">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}