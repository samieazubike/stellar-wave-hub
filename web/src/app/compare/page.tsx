import Image from "next/image";
import Link from "next/link";
import {getSupabase} from "@/lib/firebase";
import CompareFinancials from "@/components/CompareFinancials";

type SearchParams = Promise<{[key: string]: string | string[] | undefined}>;
type ProjectRow = {
	id: number;
	slug: string | null;
	name: string;
	category: string | null;
	logo_url: string | null;
	website_url: string | null;
	github_url: string | null;
};
type Scores = {overall: number | null; purpose: number | null; innovation: number | null; usability: number | null; count: number};
type RatingRow = {project_id: number; score: number | null; purpose_score: number | null; innovation_score: number | null; usability_score: number | null};

const metrics: {key: keyof Pick<Scores, "overall" | "purpose" | "innovation" | "usability">; label: string}[] = [
	{key: "overall", label: "Overall rating"},
	{key: "purpose", label: "Purpose"},
	{key: "innovation", label: "Innovation"},
	{key: "usability", label: "Usability"},
];

function parseIds(values: string | string[] | undefined): number[] {
	const parts = (Array.isArray(values) ? values : values ? [values] : []).flatMap((value) => value.split(","));
	const ids: number[] = [];
	for (const part of parts) {
		const trimmed = part.trim();
		if (!/^\d+$/.test(trimmed)) continue;
		const id = Number(trimmed);
		if (Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
		if (ids.length === 3) break;
	}
	return ids;
}

function average(values: Array<number | null>): number | null {
	const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5);
	return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function safeExternalUrl(value: string | null): string | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
	} catch {
		return null;
	}
}

function formatScore(score: number | null): string {
	return score === null ? "N/A" : score.toFixed(1);
}

export default async function ComparePage({searchParams}: {searchParams: SearchParams}) {
	const {ids: requestedIds} = await searchParams;
	const ids = parseIds(requestedIds);
	let projects: ProjectRow[] = [];
	let loadFailed = false;
	let scoresByProject = new Map<number, Scores>();

	if (ids.length) {
		try {
			const supabase = getSupabase();
			const {data: projectRows, error: projectError} = await supabase
				.from("projects")
				.select("numericId, slug, name, category, logo_url, website_url, github_url")
				.in("numericId", ids)
				.in("status", ["approved", "featured"]);
			if (projectError) throw projectError;
			const projectData = (projectRows ?? []) as Array<Omit<ProjectRow, "id"> & {numericId: number}>;
			projects = ids.flatMap((id) => {
				const project = projectData.find((item) => Number(item.numericId) === id);
				return project ? [{...project, id: Number(project.numericId)}] : [];
			});

			if (projects.length) {
				const projectIds = projects.map((project) => project.id);
				const {data: ratingRows, error: ratingsError} = await supabase
					.from("ratings")
					.select("project_id, score, purpose_score, innovation_score, usability_score")
					.in("project_id", projectIds);
				if (ratingsError) throw ratingsError;
				const ratings = (ratingRows ?? []) as RatingRow[];
				scoresByProject = new Map(projects.map((project) => {
					const projectRatings = ratings.filter((rating) => Number(rating.project_id) === project.id);
					return [project.id, {
						overall: average(projectRatings.map((rating) => rating.score)),
						purpose: average(projectRatings.map((rating) => rating.purpose_score)),
						innovation: average(projectRatings.map((rating) => rating.innovation_score)),
						usability: average(projectRatings.map((rating) => rating.usability_score)),
						count: projectRatings.length,
					}];
				}));
			}
		} catch (error) {
			console.error("Compare projects load error:", error);
			loadFailed = true;
		}
	}

	const projectScores = projects.map((project) => scoresByProject.get(project.id) ?? {overall: null, purpose: null, innovation: null, usability: null, count: 0});
	const noSelection = ids.length === 0;
	const noProjects = !loadFailed && projects.length === 0;
	const leaders = metrics.map((metric) => {
		const valid = projectScores.map((scores) => scores[metric.key]).filter((value): value is number => value !== null && Number.isFinite(value));
		if (!valid.length) return new Set<number>();
		const highest = Math.max(...valid);
		return new Set(projectScores.flatMap((scores, index) => scores[metric.key] === highest ? [index] : []));
	});

	return (
		<main className="relative z-10 min-h-screen bg-cosmic px-4 py-10 sm:px-6 lg:py-14">
			<div className="mx-auto max-w-7xl">
				<header className="mb-8 text-center sm:mb-10">
					<p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-plasma-bright">Project insights</p>
					<h1 className="text-3xl font-bold text-gradient-nova sm:text-4xl">Compare projects</h1>
					<p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-moonlight/75 sm:text-base">See community ratings side by side and find the project that fits your needs.</p>
				</header>

				{loadFailed ? (
					<EmptyState title="Comparison unavailable" message="We couldn’t load these projects right now. Please try again in a moment." />
				) : noSelection || noProjects ? (
					<EmptyState title={noSelection ? "Choose projects to compare" : "No matching projects found"} message={noSelection ? "Add two or three project IDs to the URL, like /compare?ids=12,24." : "Check the IDs and try again. Only published projects can be compared."} />
				) : projects.length < 2 ? (
					<EmptyState title="Select at least two projects" message="We found one published project. Add another project ID to compare ratings." />
				) : (
					<>
						<div className="hidden overflow-hidden rounded-2xl glass md:block">
							<table className="w-full table-fixed text-left">
								<thead>
									<tr className="border-b border-dust/40">
										<th scope="col" className="w-44 px-5 py-6 text-sm font-semibold text-ash lg:w-56">Comparison</th>
										{projects.map((project) => <th scope="col" key={project.id} className="px-5 py-6 align-top">
										<ProjectHeader project={project} />
										</th>)}
									</tr>
								</thead>
								<tbody>
									{metrics.map((metric, metricIndex) => <tr key={metric.key} className="border-b border-dust/25 last:border-b-0">
										<th scope="row" className="px-5 py-5 text-sm font-medium text-moonlight">{metric.label}</th>
										{projectScores.map((scores, projectIndex) => <td key={projects[projectIndex].id} className="px-5 py-5">
											<ScoreValue score={scores[metric.key]} highlighted={leaders[metricIndex].has(projectIndex)} />
										</td>)}
									</tr>)}
									<tr className="border-t border-dust/25">
										<th scope="row" className="px-5 py-5 text-sm font-medium text-moonlight">Rating count</th>
										{projectScores.map((scores, index) => <td key={projects[index].id} className="px-5 py-5 text-sm text-starlight">{scores.count}</td>)}
									</tr>
									<CompareFinancials projectIds={projects.map((project) => project.id)} layout="table" />
								</tbody>
							</table>
						</div>

						<div className="grid gap-4 md:hidden">
							{projects.map((project, projectIndex) => <article key={project.id} className="glass rounded-2xl p-5">
								<ProjectHeader project={project} />
								<dl className="mt-5 divide-y divide-dust/30 border-t border-dust/30">
									{metrics.map((metric, metricIndex) => <div key={metric.key} className="flex items-center justify-between gap-4 py-3">
										<dt className="text-sm text-moonlight">{metric.label}</dt>
										<dd><ScoreValue score={projectScores[projectIndex][metric.key]} highlighted={leaders[metricIndex].has(projectIndex)} /></dd>
									</div>)}
									<div className="flex items-center justify-between gap-4 py-3">
										<dt className="text-sm text-moonlight">Rating count</dt>
										<dd className="text-sm text-starlight">{projectScores[projectIndex].count}</dd>
									</div>
									<CompareFinancials projectIds={projects.map((project) => project.id)} layout="card" projectIndex={projectIndex} />
								</dl>
							</article>)}
						</div>
					</>
				)}
			</div>
		</main>
	);
}

function ScoreValue({score, highlighted}: {score: number | null; highlighted: boolean}) {
	return <span className={`inline-flex min-w-16 items-center justify-center rounded-lg px-3 py-2 text-sm font-bold tabular-nums ${highlighted ? "border border-plasma/30 bg-plasma/10 text-plasma-bright" : "text-starlight"}`}>
		{formatScore(score)}{score !== null && <span className="ml-1 text-xs font-normal text-ash">/ 5</span>}
	</span>;
}

function ProjectHeader({project}: {project: ProjectRow}) {
	const website = safeExternalUrl(project.website_url);
	const github = safeExternalUrl(project.github_url);
	return <div className="min-w-0">
		<div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-nova/20 bg-gradient-to-br from-nova/25 to-plasma/20 text-lg font-bold text-nova-bright">
			{project.logo_url ? <Image src={project.logo_url} alt={`${project.name} logo`} width={48} height={48} unoptimized className="h-full w-full object-cover" /> : project.name.slice(0, 1).toUpperCase()}
		</div>
		<h2 className="break-words text-lg font-semibold leading-snug text-starlight">{project.name}</h2>
		<p className="mt-1 text-xs capitalize text-ash">{project.category || "Uncategorized"}</p>
		<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
			<Link href={`/projects/${project.slug || project.id}`} className="font-semibold text-nova-bright hover:text-plasma-bright">View project</Link>
			{website && <a href={website} target="_blank" rel="noopener noreferrer" className="max-w-full break-all text-plasma-bright hover:underline" aria-label={`Visit ${project.name} website`}>Website ↗</a>}
			{github && <a href={github} target="_blank" rel="noopener noreferrer" className="max-w-full break-all text-plasma-bright hover:underline" aria-label={`View ${project.name} on GitHub`}>GitHub ↗</a>}
		</div>
	</div>;
}

function EmptyState({title, message}: {title: string; message: string}) {
	return <section className="glass mx-auto max-w-2xl rounded-2xl px-6 py-12 text-center sm:px-10">
		<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-nova/30 bg-nova/10 text-xl text-nova-bright" aria-hidden="true">✦</div>
		<h2 className="text-xl font-semibold text-starlight">{title}</h2>
		<p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-moonlight/75">{message}</p>
		<Link href="/explore" className="mt-6 inline-flex rounded-lg border border-plasma/30 bg-plasma/10 px-4 py-2 text-sm font-semibold text-plasma-bright hover:bg-plasma/20">Explore projects</Link>
	</section>;
}
