"use client";

import {useEffect, useState, type ComponentProps} from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import {useAuth} from "@/context/AuthContext";
import {useBookmarks} from "@/context/BookmarksContext";
import {apiFetch} from "@/lib/api-fetch";

type SavedProject = ComponentProps<typeof ProjectCard>["project"];

export default function SavedPage() {
	const {user, loading: authLoading} = useAuth();
	const {
		projectIds,
		loading: bookmarksLoading,
		error: bookmarksError,
	} = useBookmarks();
	const [projects, setProjects] = useState<SavedProject[]>([]);
	const [projectsLoading, setProjectsLoading] = useState(true);
	const [projectsError, setProjectsError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading || bookmarksLoading) return;
		if (!user) {
			setProjects([]);
			setProjectsError(null);
			setProjectsLoading(false);
			return;
		}
		if (bookmarksError) {
			setProjects([]);
			setProjectsError(bookmarksError);
			setProjectsLoading(false);
			return;
		}
		if (projectIds.length === 0) {
			setProjects([]);
			setProjectsError(null);
			setProjectsLoading(false);
			return;
		}

		let cancelled = false;
		setProjectsLoading(true);
		setProjectsError(null);

		Promise.all(
			projectIds.map(async (projectId) => {
				const result = await apiFetch<{project: SavedProject}>(
					`/api/projects/${projectId}`,
					{cache: "no-store"},
				);
				if (!result?.project) {
					throw new Error(`Could not load saved project ${projectId}.`);
				}
				return result.project;
			}),
		)
			.then((savedProjects) => {
				if (!cancelled) setProjects(savedProjects);
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setProjectsError(
						reason instanceof Error
							? reason.message
							: "Could not load saved projects.",
					);
				}
			})
			.finally(() => {
				if (!cancelled) setProjectsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		authLoading,
		bookmarksError,
		bookmarksLoading,
		projectIds,
		user,
	]);

	const loading = authLoading || (Boolean(user) && (bookmarksLoading || projectsLoading));
	const error = bookmarksError || projectsError;

	return (
		<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-10 animate-in">
				<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-nova-bright">
					Your collection
				</p>
				<h1 className="mb-2 font-display text-3xl font-bold text-starlight sm:text-4xl">
					Saved Projects
				</h1>
				<p className="text-lg text-ash">
					Projects you want to come back to.
				</p>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(3)].map((_, index) => (
						<div key={index} className="skeleton h-56 rounded-2xl" />
					))}
				</div>
			) : !user ? (
				<div className="glass rounded-2xl p-12 text-center">
					<h2 className="mb-2 text-xl font-semibold text-starlight">
						Sign in to see your saved projects
					</h2>
					<p className="mb-6 text-ash">
						Your bookmarks are tied to your account, so they follow you between visits.
					</p>
					<Link href="/login" className="btn-nova inline-flex">
						Sign in
					</Link>
				</div>
			) : error ? (
				<div role="alert" className="glass rounded-2xl p-8 text-center">
					<p className="text-supernova">{error}</p>
				</div>
			) : projects.length > 0 ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project, index) => (
						<ProjectCard
							key={project.id}
							project={project}
							index={index}
						/>
					))}
				</div>
			) : (
				<div className="glass rounded-2xl p-12 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stardust/50">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="text-ash"
							aria-hidden="true"
						>
							<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
						</svg>
					</div>
					<h2 className="mb-2 text-xl font-semibold text-starlight">
						No saved projects yet
					</h2>
					<p className="mb-6 text-ash">
						Bookmark a project to keep it close at hand.
					</p>
					<Link href="/explore" className="btn-nova inline-flex">
						Explore projects
					</Link>
				</div>
			)}
		</div>
	);
}
