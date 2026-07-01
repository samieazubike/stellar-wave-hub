"use client";

import {useCallback, useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {canFeatureProjects, canReviewProjects} from "@/lib/rbac";
import {PROJECT_CATEGORIES} from "@/lib/categories";
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

interface CategoryOption {
	value: string;
	label: string;
}

interface MaintainerAssignment {
	id: number;
	username: string;
	email: string | null;
	categories: string[];
}

export default function AdminPage() {
	const {user, token} = useAuth();
	const [pending, setPending] = useState<Project[]>([]);
	const [assignedCategories, setAssignedCategories] = useState<
		string[] | null
	>(null);
	const [maintainers, setMaintainers] = useState<MaintainerAssignment[]>([]);
	const [assignmentCategories, setAssignmentCategories] =
		useState<CategoryOption[]>([...PROJECT_CATEGORIES]);
	const [loading, setLoading] = useState(true);
	const [assignmentsLoading, setAssignmentsLoading] = useState(false);
	const [savingMaintainerId, setSavingMaintainerId] = useState<number | null>(
		null,
	);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	const fetchPending = useCallback(async () => {
		try {
			const res = await fetch("/api/projects/pending", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setPending(data.projects || []);
				setAssignedCategories(data.assignedCategories ?? null);
			}
		} catch {}
		setLoading(false);
	}, [token]);

	const fetchMaintainerAssignments = useCallback(async () => {
		setAssignmentsLoading(true);
		try {
			const res = await fetch("/api/admin/maintainer-categories", {
				headers: {Authorization: `Bearer ${token}`},
			});
			if (res.ok) {
				const data = await res.json();
				setMaintainers(data.maintainers || []);
				setAssignmentCategories(data.categories || [
					...PROJECT_CATEGORIES,
				]);
			}
		} catch {}
		setAssignmentsLoading(false);
	}, [token]);

	useEffect(() => {
		if (!token) {
			setLoading(false);
			return;
		}
		fetchPending();
	}, [fetchPending, token]);

	useEffect(() => {
		if (!token || user?.role !== "admin") return;
		fetchMaintainerAssignments();
	}, [fetchMaintainerAssignments, token, user?.role]);

	const toggleMaintainerCategory = async (
		maintainer: MaintainerAssignment,
		category: string,
	) => {
		const nextCategories = maintainer.categories.includes(category)
			? maintainer.categories.filter((item) => item !== category)
			: [...maintainer.categories, category];

		setSavingMaintainerId(maintainer.id);
		try {
			const res = await fetch("/api/admin/maintainer-categories", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					maintainerId: maintainer.id,
					categories: nextCategories,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setMaintainers((prev) =>
					prev.map((item) =>
						item.id === maintainer.id
							? {...item, categories: data.categories || []}
							: item,
					),
				);
			}
		} catch {}
		setSavingMaintainerId(null);
	};

	const categoryLabel = (value: string) => {
		return (
			PROJECT_CATEGORIES.find((category) => category.value === value)
				?.label || value
		);
	};

	const handleAction = async (
		projectId: number,
		action: "approve" | "reject",
		extra?: {featured?: boolean; reason?: string},
	) => {
		setActionLoading(projectId);
		try {
			const res = await fetch(`/api/projects/${projectId}/${action}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(extra || {}),
			});
			if (res.ok) {
				setPending((prev) => prev.filter((p) => p.id !== projectId));
			}
		} catch {}
		setActionLoading(null);
	};

	if (!user || !canReviewProjects(user.role)) {
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
						Reviewer access required
					</h2>
					<p className="text-ash mb-6">
						You need maintainer or admin privileges to view this page
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
					Review Queue
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

			{assignedCategories && (
				<div className="glass rounded-2xl p-5 mb-10 animate-in animate-in-delay-1">
					<p className="text-xs uppercase tracking-[0.18em] text-ash mb-3">
						Your moderation scope
					</p>
					<div className="flex flex-wrap gap-2">
						{assignedCategories.length > 0 ? (
							assignedCategories.map((category) => (
								<span key={category} className="tag tag-nova">
									{categoryLabel(category)}
								</span>
							))
						) : (
							<p className="text-sm text-ash">
								No categories assigned yet
							</p>
						)}
					</div>
				</div>
			)}

			{user.role === "admin" && (
				<div className="glass rounded-2xl p-6 mb-10 animate-in animate-in-delay-2">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
						<div>
							<h2 className="font-semibold text-xl text-starlight">
								Maintainer Categories
							</h2>
							<p className="text-sm text-ash mt-1">
								Assign maintainers to the categories they can moderate
							</p>
						</div>
						<button
							onClick={fetchMaintainerAssignments}
							disabled={assignmentsLoading}
							className="btn-ghost text-sm !py-2 !px-3 disabled:opacity-50"
						>
							Refresh
						</button>
					</div>

					{assignmentsLoading ? (
						<div className="space-y-3">
							{[...Array(2)].map((_, i) => (
								<div
									key={i}
									className="skeleton h-24 rounded-2xl"
								/>
							))}
						</div>
					) : maintainers.length > 0 ? (
						<div className="space-y-4">
							{maintainers.map((maintainer) => (
								<div
									key={maintainer.id}
									className="rounded-2xl border border-dust/30 bg-stardust/20 p-4"
								>
									<div className="flex flex-col lg:flex-row lg:items-start gap-4">
										<div className="lg:w-56 shrink-0">
											<p className="font-medium text-moonlight">
												{maintainer.username}
											</p>
											{maintainer.email && (
												<p className="text-xs text-ash mt-1 break-all">
													{maintainer.email}
												</p>
											)}
										</div>
										<div className="flex flex-wrap gap-2">
											{assignmentCategories.map(
												(category) => {
													const selected =
														maintainer.categories.includes(
															category.value,
														);
													return (
														<button
															key={
																category.value
															}
															onClick={() =>
																toggleMaintainerCategory(
																	maintainer,
																	category.value,
																)
															}
															disabled={
																savingMaintainerId ===
																maintainer.id
															}
															className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${
																selected
																	? "bg-nova/20 border-nova/30 text-nova-bright"
																	: "bg-stardust/40 border-dust/30 text-ash hover:text-moonlight hover:border-dust"
															}`}
														>
															{category.label}
														</button>
													);
												},
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-ash">
							No maintainer users found
						</p>
					)}
				</div>
			)}

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
										{canFeatureProjects(user.role) && (
											<button
												disabled={
													actionLoading ===
													project.id
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
										)}
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
