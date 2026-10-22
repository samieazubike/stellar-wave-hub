"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import ProjectCard from "@/components/ProjectCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";

interface Project {
	id: number;
	name: string;
	slug: string;
	description: string;
	category: string;
	status: string;
	featured: number;
	tags?: string;
	avg_rating?: number;
	rating_count?: number;
	username?: string;
	rating_velocity?: number;
	created_at?: string;
}

export default function Home() {
	const [spotlights, setSpotlights] = useState<Project[]>([]);
	const [trending, setTrending] = useState<Project[]>([]);
	const [trendingFallback, setTrendingFallback] = useState(false);
	const [newThisWeek, setNewThisWeek] = useState<Project[]>([]);
	const [featured, setFeatured] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.allSettled([
			// Active (paid, unexpired) spotlights only.
			fetch("/api/spotlights").then((r) => r.json()),
			fetch("/api/projects/trending?limit=6").then((r) => r.json()),
			fetch("/api/projects?limit=6&sort=new-this-week").then((r) => r.json()),
			fetch("/api/projects?limit=6&sort=top-rated").then((r) => r.json()),
		])
			.then(([spotlightRes, trendingRes, newRes, topRes]) => {
				if (spotlightRes.status === "fulfilled") {
					setSpotlights(spotlightRes.value.spotlights || []);
				}
				if (trendingRes.status === "fulfilled") {
					setTrending(trendingRes.value.projects || []);
					setTrendingFallback(Boolean(trendingRes.value.meta?.fallback));
				}
				if (newRes.status === "fulfilled") {
					setNewThisWeek(newRes.value.projects || []);
				}
				if (topRes.status === "fulfilled") {
					setFeatured(topRes.value.projects || []);
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="relative">
			{/* Hero */}
			<section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-36">
				{/* Large gradient orb */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-nova/10 via-plasma/5 to-transparent blur-3xl pointer-events-none" />

				<div className="max-w-5xl mx-auto text-center relative">
					<div className="animate-in">
						<span className="tag tag-nova mb-6 inline-flex">
							Stellar Wave Program
						</span>
					</div>

					<h1 className="animate-in animate-in-delay-1 font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.9] mb-6">
						<span className="text-starlight">Discover the</span>
						<br />
						<span className="text-gradient-nova">Stellar Wave</span>
						<br />
						<span className="text-starlight">Ecosystem</span>
					</h1>

					<p className="animate-in animate-in-delay-2 text-lg sm:text-xl text-moonlight/80 max-w-2xl mx-auto mb-10 leading-relaxed">
						The community-driven directory where you can explore,
						rate, and track every project built through the Stellar
						Wave Program. Real projects. Real on-chain data.
					</p>

					<div className="animate-in animate-in-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="/explore"
							className="btn-nova text-base px-8 py-3.5 inline-flex items-center gap-2"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.3-4.3" />
							</svg>
							Explore Projects
						</Link>
						<Link
							href="/submit"
							className="btn-ghost text-base px-8 py-3.5 inline-flex items-center gap-2"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M12 5v14M5 12h14" />
							</svg>
							Submit a Project
						</Link>
					</div>
				</div>
			</section>

			{/* Featured spotlights carousel */}
			<FeaturedCarousel projects={spotlights} loading={loading} />

			{/* Stats */}
			<section className="px-4 sm:px-6 lg:px-8 pb-20">
				<div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
					{[
						{
							label: "Wave Projects",
							icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
						},
						{
							label: "Community Ratings",
							icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
						},
						{
							label: "On-Chain Tracking",
							icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
						},
					].map((item, i) => (
						<div
							key={i}
							className={`glass rounded-2xl p-6 text-center animate-in animate-in-delay-${i + 1}`}
						>
							<div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-nova/20 to-plasma/20 flex items-center justify-center">
								<svg
									width="22"
									height="22"
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--nova-bright)"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d={item.icon} />
								</svg>
							</div>
							<p className="text-sm font-semibold text-moonlight">
								{item.label}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Trending Section */}
			<section className="px-4 sm:px-6 lg:px-8 pb-20">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-between mb-8">
						<div>
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar/10 border border-solar/30 text-solar-bright text-xs font-semibold uppercase tracking-wider mb-2">
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
								</svg>
								Rating Velocity
							</div>
							<h2 className="font-display font-bold text-2xl sm:text-3xl text-starlight">
								Trending
							</h2>
							<p className="text-ash mt-1">
								{trendingFallback
									? "No ratings in the last 7 days — showing the highest rated projects instead"
									: "Projects with the most community ratings in the last 7 days"}
							</p>
						</div>
						<Link
							href="/explore?sort=trending"
							className="btn-ghost text-sm hidden sm:inline-flex items-center gap-1"
						>
							View All Trending
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m9 18 6-6-6-6" />
							</svg>
						</Link>
					</div>

					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(6)].map((_, i) => (
								<div
									key={i}
									className="skeleton h-56 rounded-2xl"
								/>
							))}
						</div>
					) : trending.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{trending.map((project, i) => (
								<ProjectCard
									key={project.id}
									project={project}
									index={i}
									badge={{
										label: trendingFallback ? "Top Rated" : "Trending",
										variant: "solar",
									}}
								/>
							))}
						</div>
					) : (
						<div className="glass rounded-2xl p-12 text-center text-ash">
							No projects to show yet. Rate a project to put it on the trending list!
						</div>
					)}
				</div>
			</section>

			{/* New This Week Section */}
			{(loading || newThisWeek.length > 0) && (
				<section className="px-4 sm:px-6 lg:px-8 pb-20">
					<div className="max-w-7xl mx-auto">
						<div className="flex items-center justify-between mb-8">
							<div>
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aurora/10 border border-aurora/30 text-aurora-bright text-xs font-semibold uppercase tracking-wider mb-2">
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
									</svg>
									From Created At
								</div>
								<h2 className="font-display font-bold text-2xl sm:text-3xl text-starlight">
									New this week
								</h2>
								<p className="text-ash mt-1">
									The latest projects submitted and cataloged in the Stellar Wave ecosystem
								</p>
							</div>
							<Link
								href="/explore?sort=new-this-week"
								className="btn-ghost text-sm hidden sm:inline-flex items-center gap-1"
							>
								View All New
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</Link>
						</div>

						{loading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{[...Array(6)].map((_, i) => (
									<div
										key={i}
										className="skeleton h-56 rounded-2xl"
									/>
								))}
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{newThisWeek.map((project, i) => (
									<ProjectCard
										key={project.id}
										project={project}
										index={i}
										badge={{label: "New", variant: "aurora"}}
									/>
								))}
							</div>
						)}
					</div>
				</section>
			)}

			{/* Top Projects (All-Time Highest Rated) */}
			<section className="px-4 sm:px-6 lg:px-8 pb-24">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-between mb-8">
						<div>
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nova/10 border border-nova/30 text-nova-bright text-xs font-semibold uppercase tracking-wider mb-2">
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
								</svg>
								Top Rated
							</div>
							<h2 className="font-display font-bold text-2xl sm:text-3xl text-starlight">
								Top Projects
							</h2>
							<p className="text-ash mt-1">
								Highest rated projects in the Wave ecosystem
							</p>
						</div>
						<Link
							href="/explore?sort=top-rated"
							className="btn-ghost text-sm hidden sm:inline-flex items-center gap-1"
						>
							View All
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m9 18 6-6-6-6" />
							</svg>
						</Link>
					</div>

					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(6)].map((_, i) => (
								<div
									key={i}
									className="skeleton h-56 rounded-2xl"
								/>
							))}
						</div>
					) : featured.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{featured.map((project, i) => (
								<ProjectCard
									key={project.id}
									project={project}
									index={i}
								/>
							))}
						</div>
					) : (
						<div className="glass rounded-2xl p-16 text-center">
							<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
								<svg
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--ash)"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
								</svg>
							</div>
							<h3 className="font-semibold text-lg text-moonlight mb-2">
								No projects yet
							</h3>
							<p className="text-ash mb-6">
								Be the first to submit a project to Stellar Wave
								Hub
							</p>
							<Link
								href="/submit"
								className="btn-nova inline-flex"
							>
								Submit a Project
							</Link>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}