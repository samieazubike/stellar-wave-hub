"use client";

import Link from "next/link";
import { useCompare } from "@/context/CompareContext";

export default function CompareTray() {
	const { projects, removeProject } = useCompare();

	if (projects.length === 0) return null;

	const ids = projects.map((project) => project.id).join(",");

	return (
		<aside
			aria-label="Selected projects for comparison"
			className="fixed inset-x-0 bottom-0 z-50 border-t border-nova/30 bg-cosmic/95 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
		>
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
					<div className="flex items-center gap-2 text-sm font-semibold text-starlight">
						<span className="flex h-7 w-7 items-center justify-center rounded-full bg-nova/20 text-xs text-nova-bright">
							{projects.length}
						</span>
						<span>Compare projects</span>
					</div>
					<ul className="flex min-w-0 flex-wrap gap-2">
						{projects.map((project) => (
							<li
								key={project.id}
								className="flex max-w-full items-center gap-2 rounded-full border border-dust/30 bg-stardust/80 px-3 py-1.5 text-sm text-moonlight"
							>
								<span className="max-w-40 truncate">{project.name}</span>
								<button
									type="button"
									onClick={() => removeProject(project.id)}
									aria-label={`Remove ${project.name} from comparison`}
									className="text-ash transition-colors hover:text-starlight"
								>
									<span aria-hidden="true">×</span>
								</button>
							</li>
						))}
					</ul>
				</div>
				<Link
					href={`/compare?ids=${ids}`}
					className="btn-primary shrink-0 !py-2.5 !px-5"
				>
					Compare
				</Link>
			</div>
		</aside>
	);
}
