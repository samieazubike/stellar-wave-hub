"use client";

import {useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import Link from "next/link";

interface Project {
	id: number;
	name: string;
	slug: string;
	description: string;
	category: string;
	status: string;
	username: string;
	stellar_account_id?: string;
	created_at: string;
}

export default function AdminPage() {
	const {user, token} = useAuth();
	const [pending, setPending] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	const fetchPending = async () => {
		try {
			const res = await fetch("/api/projects/pending", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setPending(data.projects || []);
			}
		} catch {}
		setLoading(false);
	};

	useEffect(() => {
		if (!token) {
			setLoading(false);
			return;
		}
		fetchPending();
		// fetchPending is stable within this effect scope; token is the real dependency
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const handleAction = async (
		projectId: number,
		action: "approve" | "reject",
		extra?: {featured?: boolean; reason?: string},
	) => {
		setActionLoading(projectId);
		try {
			await fetch(`/api/projects/${projectId}/${action}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(extra || {}),
			});
			setPending((prev) => prev.filter((p) => p.id !== projectId));
		} catch {}
		setActionLoading(null);
	};

	if (!user || user.role !== "admin") {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="glass rounded-2xl p-12 text-center max-w-md">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 flex items-center justify-center">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--supernova)"
							strokeWidth="1.5"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<h2 className="font-semibold text-xl text-starlight mb-2">
						Admin access required
					</h2>
					<p className="text-ash mb-6">
						You need admin privileges to view this page
					</p>
					<Link href="/explore" className="btn-ghost inline-flex">
						Back to Explore
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="mb-8 animate-in">
				<h1 className="font-display font-bold text-3xl text-starlight mb-1">
					Admin Dashboard
				</h1>
				<p className="text-ash">
					Review and manage project submissions
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-in animate-in-delay-1">
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-solar-bright">
						{pending.length}
					</p>
					<p className="text-sm text-ash mt-1">Pending Review</p>
				</div>
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-aurora-bright">-</p>
					<p className="text-sm text-ash mt-1">Approved</p>
				</div>
				<div className="glass rounded-2xl p-6 text-center">
					<p className="text-3xl font-bold text-plasma-bright">-</p>
					<p className="text-sm text-ash mt-1">Total Projects</p>
				</div>
			</div>

			{/* Pending Queue */}
			<div className="animate-in animate-in-delay-2">
				<h2 className="font-semibold text-xl text-starlight mb-6">
					Pending Submissions
				</h2>

				{loading ? (
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="skeleton h-36 rounded-2xl"
							/>
						))}
					</div>
				) : pending.length > 0 ? (
					<div className="space-y-4">
						{pending.map((project) => (
							<div
								key={project.id}
								className="glass rounded-2xl p-6"
							>
								<div className="flex flex-col lg:flex-row lg:items-start gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="font-semibold text-lg text-starlight">
												{project.name}
											</h3>
											<span className="tag tag-nova">
												{project.category}
											</span>
										</div>
										<p className="text-sm text-moonlight/80 mb-2 line-clamp-2">
											{project.description}
										</p>
										<div className="flex gap-4 text-xs text-ash">
											<span>by {project.username}</span>
											<span>
												{new Date(
													project.created_at,
												).toLocaleDateString()}
											</span>
											{project.stellar_account_id && (
												<span className="font-mono">
													{project.stellar_account_id.slice(
														0,
														10,
													)}
													...
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<Link
											href={`/projects/${project.slug}`}
											className="btn-ghost text-sm !py-2 !px-3"
										>
											Preview
										</Link>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() =>
												handleAction(
													project.id,
													"approve",
													{featured: false},
												)
											}
											className="bg-aurora/15 hover:bg-aurora/25 text-aurora-bright border border-aurora/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Approve
										</button>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() =>
												handleAction(
													project.id,
													"approve",
													{featured: true},
												)
											}
											className="bg-solar/15 hover:bg-solar/25 text-solar-bright border border-solar/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Feature
										</button>
										<button
											disabled={
												actionLoading === project.id
											}
											onClick={() => {
												const reason = prompt(
													"Rejection reason (optional):",
												);
												handleAction(
													project.id,
													"reject",
													{
														reason:
															reason || undefined,
													},
												);
											}}
											className="bg-supernova/15 hover:bg-supernova/25 text-supernova border border-supernova/20 font-medium text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
										>
											Reject
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="glass rounded-2xl p-12 text-center">
						<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-aurora/10 flex items-center justify-center">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--aurora)"
								strokeWidth="1.5"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</div>
						<h3 className="font-semibold text-lg text-moonlight mb-2">
							All caught up!
						</h3>
						<p className="text-ash">No projects pending review</p>
					</div>
				)}
			</div>
		</div>
	);
}
