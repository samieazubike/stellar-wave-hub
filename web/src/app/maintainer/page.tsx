"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasMinRole } from "@/lib/roles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  username: string;
  created_at: string;
}

function usePendingProjects(token: string | null) {
  return useQuery<Project[]>({
    queryKey: ["maintainer-projects", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/projects/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch pending projects");
      const data = await res.json();
      return data.projects || [];
    },
    enabled: !!token,
  });
}

function useRecentlyModerated(token: string | null) {
  return useQuery<Project[]>({
    queryKey: ["maintainer-projects", "moderated"],
    queryFn: async () => {
      const res = await fetch("/api/admin/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      const all: Project[] = data.projects || [];
      // Filter out submitted (pending) and sort by some date if possible, 
      // but since we only have created_at, we just show recently created non-submitted
      return all
        .filter((p) => p.status !== "submitted")
        .slice(0, 5);
    },
    enabled: !!token,
  });
}

export default function MaintainerDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !hasMinRole(user.role, "maintainer"))) {
      router.push("/login?redirect=/maintainer");
    }
  }, [user, loading, router]);

  const { data: pending = [], isLoading: pendingLoading } = usePendingProjects(token);
  const { data: moderated = [], isLoading: moderatedLoading } = useRecentlyModerated(token);

  if (loading || !user || !hasMinRole(user.role, "maintainer")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="skeleton w-32 h-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora/30 to-nova/30 border border-aurora/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--aurora-bright)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-starlight">Maintainer Dashboard</h1>
        </div>
        <p className="text-ash ml-[52px]">Overview of moderation queue and recent activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in animate-in-delay-1">
        
        {/* Pending Stats */}
        <div className="glass rounded-2xl p-6 md:col-span-1">
          <h2 className="text-sm font-semibold text-ash uppercase tracking-wider mb-4">Pending Review</h2>
          {pendingLoading ? (
            <div className="skeleton h-16 w-full rounded-xl" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-solar-bright">{pending.length}</span>
              <span className="text-ash">projects</span>
            </div>
          )}
          <div className="mt-6">
            <Link href="/admin" className="btn-nova w-full block text-center py-2 text-sm">
              Go to Moderation Queue
            </Link>
          </div>
        </div>

        {/* Recently Moderated */}
        <div className="glass rounded-2xl p-6 md:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ash uppercase tracking-wider">Recently Moderated</h2>
            <Link href="/admin" className="text-xs text-aurora-bright hover:underline">View All</Link>
          </div>
          
          {moderatedLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          ) : moderated.length > 0 ? (
            <div className="space-y-3 flex-1">
              {moderated.map((p) => (
                <div key={p.id} className="bg-stardust/40 rounded-xl px-4 py-3 flex items-center justify-between border border-dust/20 hover:border-dust/40 transition-colors">
                  <div className="min-w-0">
                    <Link href={`/projects/${p.slug}`} className="font-medium text-starlight hover:text-nova-bright truncate block">
                      {p.name}
                    </Link>
                    <div className="text-xs text-ash mt-0.5">by {p.username}</div>
                  </div>
                  <span className={`tag text-xs shrink-0 ${p.status === "approved" ? "tag-aurora" : p.status === "rejected" ? "bg-supernova/10 text-supernova" : "tag-solar"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stardust/20 rounded-xl border border-dust/10 p-6">
              <p className="text-ash text-sm">No recently moderated projects.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="mt-8 animate-in animate-in-delay-2">
        <h2 className="text-sm font-semibold text-ash uppercase tracking-wider mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="https://github.com/samieazubike/stellar-wave-hub/blob/main/docs/MAINTAINERS.md" target="_blank" rel="noopener noreferrer" className="glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-aurora/30 transition-colors text-center group">
            <svg className="text-ash group-hover:text-aurora-bright transition-colors" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span className="text-sm text-moonlight font-medium">Maintainer Guide</span>
          </a>
          <Link href="/admin" className="glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-aurora/30 transition-colors text-center group">
            <svg className="text-ash group-hover:text-aurora-bright transition-colors" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-sm text-moonlight font-medium">Full Admin Panel</span>
          </Link>
          <Link href="/explore" className="glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-aurora/30 transition-colors text-center group">
            <svg className="text-ash group-hover:text-aurora-bright transition-colors" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="text-sm text-moonlight font-medium">Public Directory</span>
          </Link>
          <Link href="/profile" className="glass rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-aurora/30 transition-colors text-center group">
            <svg className="text-ash group-hover:text-aurora-bright transition-colors" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-sm text-moonlight font-medium">My Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
