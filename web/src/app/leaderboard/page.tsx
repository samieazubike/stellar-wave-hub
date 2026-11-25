"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/components/Avatar";

type Range = "week" | "all";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar_url: string | null;
  xp: number;
  badges: string[];
}

const TABS: { value: Range; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

const RANK_STYLES: Record<number, string> = {
  1: "bg-solar/15 text-solar-bright border-solar/30",
  2: "bg-moonlight/10 text-moonlight border-moonlight/30",
  3: "bg-supernova/10 text-supernova border-supernova/30",
};

export default function LeaderboardPage() {
  const [range, setRange] = useState<Range>("week");

  const { data, isLoading, isError, refetch } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", range],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?range=${range}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load leaderboard");
      return body.leaderboard;
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 animate-in">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-starlight mb-2">Top Contributors</h1>
        <p className="text-ash">
          Ranked by XP: approved projects, written and on-chain reviews, and helpful votes received.
        </p>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-xl bg-stardust/40 p-1" role="tablist" aria-label="Leaderboard range">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={range === tab.value}
            onClick={() => setRange(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              range === tab.value ? "bg-nova/20 text-nova-bright" : "text-ash hover:text-moonlight"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-supernova text-sm" role="alert">Couldn&apos;t load the leaderboard.</p>
          <button type="button" onClick={() => refetch()} className="btn-ghost mt-4 text-sm">
            Try again
          </button>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="font-medium text-moonlight">
            {range === "week" ? "No activity this week yet" : "No contributors yet"}
          </p>
          <p className="mt-1 text-sm text-ash">Rate or submit a project to get on the board.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {data.map((entry) => (
            <li key={entry.userId} className="glass rounded-2xl px-4 py-3 sm:px-6 flex items-center gap-4">
              <span
                className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center text-sm font-bold ${
                  RANK_STYLES[entry.rank] ?? "border-dust/30 text-ash"
                }`}
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </span>
              <Avatar username={entry.username} avatarUrl={entry.avatar_url} className="w-10 h-10 text-sm" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${encodeURIComponent(entry.username)}`}
                  className="font-semibold text-starlight hover:text-nova-bright transition-colors truncate block"
                >
                  {entry.username}
                </Link>
                {entry.badges.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.badges.map((badge) => (
                      <span key={badge} className="tag tag-plasma text-[10px]">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-right">
                <span className="block font-mono font-bold text-lg text-solar-bright">{entry.xp.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-ash">XP</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
