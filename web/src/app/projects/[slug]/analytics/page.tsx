"use client";

import {use, useEffect, useState} from "react";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";

interface Analytics {
	project: {id: number; name: string; slug: string};
	isPro: boolean;
	days: number;
	upgradeRequired: boolean;
	dailyViews: {day: string; views: number}[];
	totalViews: number;
	referrers: {host: string; views: number}[];
	conversions: {
		tips: number;
		ratings: number;
		tipRate: number;
		ratingRate: number;
	} | null;
}

function formatDay(day: string) {
	return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

export default function ProjectAnalyticsPage({
	params,
}: {
	params: Promise<{slug: string}>;
}) {
	const {slug} = use(params);
	const {user, token, loading: authLoading} = useAuth();
	const requestKey = token ? `${slug}:${token}` : "";
	const [result, setResult] = useState<{
		key: string;
		analytics: Analytics | null;
		error: string;
	} | null>(null);

	useEffect(() => {
		if (!token || !slug) return;
		let cancelled = false;

		fetch(`/api/projects/${encodeURIComponent(slug)}/analytics`, {
			headers: {Authorization: `Bearer ${token}`},
		})
			.then(async (response) => {
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Could not load analytics.");
				if (!cancelled) {
					setResult({key: requestKey, analytics: data as Analytics, error: ""});
				}
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setResult({
						key: requestKey,
						analytics: null,
						error: reason instanceof Error ? reason.message : "Could not load analytics.",
					});
				}
			})

		return () => {
			cancelled = true;
		};
	}, [requestKey, slug, token]);

	if (authLoading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ash">Loading analytics...</div>;

	if (!user || !token) {
		return (
			<div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
				<h1 className="font-display text-2xl font-bold text-starlight">Sign in to view analytics</h1>
				<Link href="/login" className="btn-nova mt-5">Sign in</Link>
			</div>
		);
	}

	if (!result || result.key !== requestKey) {
		return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ash">Loading analytics...</div>;
	}

	const {analytics, error} = result;
	if (error || !analytics) {
		return (
			<div className="mx-auto max-w-5xl px-4 py-12">
				<p role="alert" className="rounded-xl border border-supernova/30 bg-supernova/10 p-4 text-supernova">
					{error || "Could not load analytics."}
				</p>
			</div>
		);
	}

	const maximum = Math.max(0, ...analytics.dailyViews.map((day) => day.views));
	const scaleMaximum = Math.max(1, maximum);

	return (
		<main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<Link href={`/projects/${analytics.project.slug}`} className="text-sm text-ash transition-colors hover:text-nova-bright">
						{analytics.project.name}
					</Link>
					<h1 className="mt-1 font-display text-3xl font-bold text-starlight">Project analytics</h1>
					<p className="mt-1 text-sm text-ash">Daily views across the last {analytics.days} days</p>
				</div>
				<Link href="/my-projects" className="btn-ghost text-sm">Back to projects</Link>
			</div>

			{!analytics.isPro && (
				<section className="relative mb-7 overflow-hidden rounded-2xl border border-plasma/30 bg-gradient-to-br from-plasma/15 via-space to-nova/10 p-5 sm:p-6">
					<div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-plasma/20" />
					<div className="pointer-events-none absolute -right-2 -top-12 h-36 w-36 rounded-full border border-nova/20" />
					<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="max-w-2xl">
							<p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-plasma-bright">Pro analytics</p>
							<h2 className="font-display text-xl font-bold text-starlight">See the full orbit of your audience</h2>
							<p className="mt-1 text-sm leading-6 text-ash">
								Unlock 90 days of history, referrer sources, and tip and rating conversion.
							</p>
						</div>
						<Link href="/my-projects#upgrade-to-pro-heading" className="btn-nova inline-flex shrink-0 justify-center">
							Upgrade this project
						</Link>
					</div>
				</section>
			)}

			<div className="mb-6 grid gap-4 sm:grid-cols-3">
				<section className="glass rounded-2xl p-5">
					<p className="text-xs font-semibold uppercase tracking-wider text-ash">Views · {analytics.days} days</p>
					<p className="mt-2 font-display text-4xl font-bold tabular-nums text-starlight">{analytics.totalViews.toLocaleString()}</p>
				</section>
				<section className="glass rounded-2xl p-5">
					<p className="text-xs font-semibold uppercase tracking-wider text-ash">Daily average</p>
					<p className="mt-2 font-display text-4xl font-bold tabular-nums text-starlight">
						{(analytics.totalViews / analytics.days).toFixed(1)}
					</p>
				</section>
				<section className="glass rounded-2xl p-5">
					<p className="text-xs font-semibold uppercase tracking-wider text-ash">Best day</p>
					<p className="mt-2 font-display text-4xl font-bold tabular-nums text-starlight">
						{maximum.toLocaleString()}
					</p>
					<p className="mt-1 text-xs text-ash">
						{formatDay(analytics.dailyViews.find((day) => day.views === maximum)?.day ?? analytics.dailyViews[0].day)}
					</p>
				</section>
			</div>

			<section className="glass mb-6 rounded-2xl p-5 sm:p-6">
				<div className="mb-5 flex items-center justify-between gap-3">
					<div>
						<h2 className="font-display text-lg font-bold text-starlight">Views over time</h2>
						<p className="text-xs text-ash">One view is recorded per session, per project, per day.</p>
					</div>
					<span className="rounded-full border border-dust/30 px-2.5 py-1 text-xs font-semibold text-moonlight">
						{analytics.days} days
					</span>
				</div>
				<div
					className="flex h-44 items-end gap-[2px] border-b border-dust/25 pb-1"
					role="img"
					aria-label={`Daily project views for the last ${analytics.days} days`}
				>
					{analytics.dailyViews.map((day) => (
						<div
							key={day.day}
							title={`${formatDay(day.day)}: ${day.views} views`}
							className="min-w-0 flex-1 rounded-t-sm bg-gradient-to-t from-nova/50 to-plasma-bright/90 transition-[height,opacity] hover:opacity-75"
							style={{height: `${Math.max(day.views > 0 ? 3 : 1, (day.views / scaleMaximum) * 100)}%`}}
						/>
					))}
				</div>
				<div className="mt-2 flex justify-between text-[11px] text-ash">
					<span>{formatDay(analytics.dailyViews[0].day)}</span>
					<span>{formatDay(analytics.dailyViews[analytics.dailyViews.length - 1].day)}</span>
				</div>
			</section>

			<div className="grid gap-6 lg:grid-cols-2">
				<section className="glass rounded-2xl p-5 sm:p-6">
					<h2 className="font-display text-lg font-bold text-starlight">Top referrers</h2>
					{analytics.isPro ? (
						analytics.referrers.length ? (
							<ul className="mt-4 divide-y divide-dust/15">
								{analytics.referrers.slice(0, 8).map((referrer) => (
									<li key={referrer.host} className="flex justify-between gap-4 py-3 text-sm">
										<span className="truncate text-moonlight">{referrer.host}</span>
										<span className="shrink-0 tabular-nums text-starlight">{referrer.views.toLocaleString()}</span>
									</li>
								))}
							</ul>
						) : <p className="mt-4 text-sm text-ash">No referrer data for this period yet.</p>
					) : (
						<p className="mt-3 text-sm leading-6 text-ash">See which sites send visitors when you upgrade to Pro.</p>
					)}
				</section>

				<section className="glass rounded-2xl p-5 sm:p-6">
					<h2 className="font-display text-lg font-bold text-starlight">Engagement</h2>
					{analytics.conversions ? (
						<div className="mt-4 grid grid-cols-2 gap-3">
							<div className="rounded-xl border border-dust/20 bg-space/70 p-4">
								<p className="text-xs text-ash">Tips</p>
								<p className="mt-1 text-xl font-bold text-starlight">{analytics.conversions.tips}</p>
								<p className="text-xs text-ash">{analytics.conversions.tipRate.toFixed(1)}% of views</p>
							</div>
							<div className="rounded-xl border border-dust/20 bg-space/70 p-4">
								<p className="text-xs text-ash">Ratings</p>
								<p className="mt-1 text-xl font-bold text-starlight">{analytics.conversions.ratings}</p>
								<p className="text-xs text-ash">{analytics.conversions.ratingRate.toFixed(1)}% of views</p>
							</div>
						</div>
					) : (
						<p className="mt-3 text-sm leading-6 text-ash">Track which views turn into tips and ratings with Pro analytics.</p>
					)}
				</section>
			</div>
		</main>
	);
}
