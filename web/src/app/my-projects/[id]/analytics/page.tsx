"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface DailyView {
	day: string;
	views: number;
}

interface Analytics {
	days: number;
	startDay: string;
	endDay: string;
	totalViews: number;
	averageViewsPerDay: number;
	dailyViews: DailyView[];
}

const WIDTH = 840;
const HEIGHT = 260;
const PADDING = { top: 20, right: 12, bottom: 38, left: 44 };

function formatDay(day: string, options?: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(undefined, options ?? {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${day}T00:00:00.000Z`));
}

function ViewsChart({ dailyViews }: { dailyViews: DailyView[] }) {
	const chart = useMemo(() => {
		const plotWidth = WIDTH - PADDING.left - PADDING.right;
		const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
		const maxViews = Math.max(1, ...dailyViews.map((entry) => entry.views));
		const slotWidth = plotWidth / Math.max(1, dailyViews.length);
		const barWidth = Math.max(2, slotWidth * 0.62);
		const ticks = [0, Math.ceil(maxViews / 2), maxViews]
			.filter((value, index, values) => values.indexOf(value) === index);
		const bars = dailyViews.map((entry, index) => {
			const barHeight = (entry.views / maxViews) * plotHeight;
			return {
				...entry,
				x: PADDING.left + index * slotWidth + (slotWidth - barWidth) / 2,
				y: PADDING.top + plotHeight - barHeight,
				width: barWidth,
				height: barHeight,
			};
		});
		return { plotWidth, plotHeight, maxViews, ticks, bars };
	}, [dailyViews]);

	const labelIndexes = new Set([
		0,
		dailyViews.length - 1,
		...Array.from({ length: 4 }, (_, index) =>
			Math.round(((index + 1) * (dailyViews.length - 1)) / 5),
		),
	]);

	return (
		<div className="overflow-x-auto">
			<svg
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				role="img"
				aria-label="Daily project views bar chart"
				className="min-w-[620px] w-full"
			>
				{chart.ticks.map((tick) => {
					const y =
						PADDING.top +
						chart.plotHeight -
						(tick / chart.maxViews) * chart.plotHeight;
					return (
						<g key={tick}>
							<line
								x1={PADDING.left}
								x2={WIDTH - PADDING.right}
								y1={y}
								y2={y}
								stroke="currentColor"
								strokeOpacity="0.12"
								strokeDasharray={tick === 0 ? undefined : "3 6"}
							/>
							<text
								x={PADDING.left - 10}
								y={y + 4}
								textAnchor="end"
								className="fill-ash text-[11px]"
							>
								{tick}
							</text>
						</g>
					);
				})}
				{chart.bars.map((bar, index) => (
					<g key={bar.day}>
						<rect
							x={bar.x}
							y={bar.y}
							width={bar.width}
							height={Math.max(bar.height, bar.views > 0 ? 2 : 0)}
							rx={Math.min(4, bar.width / 2)}
							className="fill-nova-bright transition-opacity hover:opacity-70"
						>
							<title>
								{formatDay(bar.day, { dateStyle: "long", timeZone: "UTC" })}: {bar.views}{" "}
								{bar.views === 1 ? "view" : "views"}
							</title>
						</rect>
						{labelIndexes.has(index) && (
							<text
								x={bar.x + bar.width / 2}
								y={HEIGHT - 12}
								textAnchor="middle"
								className="fill-ash text-[11px]"
							>
								{formatDay(bar.day)}
							</text>
						)}
					</g>
				))}
			</svg>
		</div>
	);
}

export default function ProjectAnalyticsPage() {
	const { id } = useParams<{ id: string }>();
	const { token, user, loading: authLoading } = useAuth();
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token || !id) return;
		const controller = new AbortController();
		fetch(`/api/projects/${encodeURIComponent(id)}/analytics?days=30`, {
			headers: { Authorization: `Bearer ${token}` },
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || "Unable to load analytics");
				return result as Analytics;
			})
			.then(setAnalytics)
			.catch((err: unknown) => {
				if (!controller.signal.aborted) {
					setError(err instanceof Error ? err.message : "Unable to load analytics");
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [id, token]);

	if (authLoading) {
		return (
			<main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="skeleton h-10 w-64 rounded-xl" />
				<div className="skeleton mt-6 h-80 rounded-2xl" />
			</main>
		);
	}

	if (!user) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="glass max-w-md rounded-2xl p-10 text-center">
					<h1 className="font-display text-2xl font-bold text-starlight">Sign in required</h1>
					<p className="mt-2 text-ash">Sign in to view project analytics.</p>
					<Link href="/login" className="btn-nova mt-6 inline-flex">Sign in</Link>
				</div>
			</div>
		);
	}

	return (
		<main className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="pointer-events-none absolute right-8 top-10 h-48 w-48 rounded-full bg-nova/10 blur-3xl" />
			<div className="relative">
				<Link href="/my-projects" className="text-sm text-ash transition-colors hover:text-moonlight">
					← My Projects
				</Link>
				<div className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="mb-2 font-mono text-xs uppercase tracking-[0.24em] text-nova-bright">
							Project telemetry
						</p>
						<h1 className="font-display text-3xl font-bold text-starlight sm:text-4xl">
							View analytics
						</h1>
						<p className="mt-2 text-sm text-ash">
							Daily visits to this project page over the last 30 days.
						</p>
					</div>
					<span className="rounded-full border border-dust/30 px-3 py-1 font-mono text-xs text-moonlight">
						LAST 30 DAYS
					</span>
				</div>

				{loading ? (
					<div className="space-y-4">
						<div className="skeleton h-28 rounded-2xl" />
						<div className="skeleton h-80 rounded-2xl" />
					</div>
				) : error ? (
					<div role="alert" className="glass rounded-2xl border border-supernova/20 p-6">
						<p className="font-medium text-supernova">{error}</p>
						{error === "Forbidden" && (
							<p className="mt-2 text-sm text-ash">Only the project owner or an admin can view these analytics.</p>
						)}
					</div>
				) : analytics ? (
					<>
						<section aria-label="View totals" className="mb-5 grid gap-4 sm:grid-cols-2">
							<div className="glass rounded-2xl border border-dust/25 p-6">
								<p className="font-mono text-xs uppercase tracking-widest text-ash">Total views</p>
								<p className="mt-3 font-display text-4xl font-bold tabular-nums text-starlight">
									{analytics.totalViews.toLocaleString()}
								</p>
								<p className="mt-2 text-xs text-ash">
									{formatDay(analytics.startDay)} – {formatDay(analytics.endDay)}
								</p>
							</div>
							<div className="glass rounded-2xl border border-dust/25 p-6">
								<p className="font-mono text-xs uppercase tracking-widest text-ash">Daily average</p>
								<p className="mt-3 font-display text-4xl font-bold tabular-nums text-nova-bright">
									{analytics.averageViewsPerDay.toFixed(1)}
								</p>
								<p className="mt-2 text-xs text-ash">Views per day</p>
							</div>
						</section>

						<section className="glass overflow-hidden rounded-2xl border border-dust/25">
							<div className="flex items-center justify-between border-b border-dust/20 px-6 py-5">
								<div>
									<h2 className="font-semibold text-starlight">Daily views</h2>
									<p className="mt-1 text-xs text-ash">One bar per day · UTC</p>
								</div>
								<span className="font-mono text-xs text-ash">
									{analytics.dailyViews.length} DAYS
								</span>
							</div>
							<div className="px-3 py-5 sm:px-6">
								<ViewsChart dailyViews={analytics.dailyViews} />
							</div>
						</section>
					</>
				) : null}
			</div>
		</main>
	);
}
