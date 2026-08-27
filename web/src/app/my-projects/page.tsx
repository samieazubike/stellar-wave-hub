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
	featured: number;
	avg_rating?: number;
	rating_count?: number;
	created_at: string;
	rejection_reason?: string;
}

const statusStyles: Record<string, string> = {
	submitted: "tag-solar",
	approved: "tag-aurora",
	featured: "tag-aurora",
	rejected: "tag-supernova",
};

export default function MyProjectsPage() {
	const {user, token} = useAuth();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!token) {
			setLoading(false);
			return;
		}
		fetch("/api/projects/my", {
			headers: {Authorization: `Bearer ${token}`},
		})
			.then((r) => r.json())
			.then((data) => setProjects(data.projects || []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [token]);

	if (!user) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="glass rounded-2xl p-12 text-center max-w-md">
					<h2 className="font-semibold text-xl text-starlight mb-2">
						Sign in required
					</h2>
					<p className="text-ash mb-6">
						Sign in to view your project submissions
					</p>
					<Link href="/login" className="btn-nova inline-flex">
						Sign In
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="flex items-center justify-between mb-8 animate-in">
				<div>
					<h1 className="font-display font-bold text-3xl text-starlight mb-1">
						My Projects
					</h1>
					<p className="text-ash">
						Track the status of your project submissions
					</p>
				</div>
				<Link
					href="/submit"
					className="btn-nova text-sm inline-flex items-center gap-2"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
					New Project
				</Link>
			</div>

			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="skeleton h-28 rounded-2xl" />
					))}
				</div>
			) : projects.length > 0 ? (
				<div className="space-y-4 animate-in animate-in-delay-1">
					{projects.map((project) => (
						<div
							key={project.id}
							className="glass glass-hover rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3 mb-1">
									<Link
										href={`/projects/${project.slug}`}
										className="font-semibold text-starlight hover:text-nova-bright transition-colors truncate"
									>
										{project.name}
									</Link>
									<span
										className={`tag ${statusStyles[project.status] || "tag-nova"}`}
									>
										{project.status}
									</span>
									{project.featured === 1 && (
										<span className="tag tag-solar">
											Featured
										</span>
									)}
								</div>
								<p className="text-sm text-ash line-clamp-1">
									{project.description}
								</p>
								{project.rejection_reason && (
									<p className="text-sm text-supernova mt-1">
										Rejection reason:{" "}
										{project.rejection_reason}
									</p>
								)}
								<p className="text-xs text-dust mt-2">
									Submitted{" "}
									{new Date(
										project.created_at,
									).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-3 shrink-0">
								{project.avg_rating && (
									<div className="flex items-center gap-1">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="var(--solar)"
											stroke="none"
										>
											<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
										</svg>
										<span className="text-sm font-semibold text-solar-bright">
											{Number(project.avg_rating).toFixed(
												1,
											)}
										</span>
									</div>
								)}
								<Link
									href={`/projects/${project.slug}/edit`}
									className="btn-ghost text-sm !py-1.5 !px-3"
								>
									Edit
								</Link>
								<Link
									href={`/projects/${project.slug}`}
									className="btn-ghost text-sm !py-1.5 !px-3"
								>
									View
								</Link>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="glass rounded-2xl p-16 text-center animate-in animate-in-delay-1">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--ash)"
							strokeWidth="1.5"
						>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</div>
					<h3 className="font-semibold text-lg text-moonlight mb-2">
						No projects yet
					</h3>
					<p className="text-ash mb-6">
						Submit your first project to Stellar Wave Hub
					</p>
					<Link href="/submit" className="btn-nova inline-flex">
						Submit a Project
					</Link>
				</div>
			)}
		</div>
	);
}
