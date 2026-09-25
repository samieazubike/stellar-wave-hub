import { notFound } from "next/navigation";
import { usersCol, projectsCol, ratingsCol } from "@/lib/db";
import Link from "next/link";
import StarRating from "@/components/StarRating"; // Or just render stars manually if it's client-only

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	// Lookup user by username
	const userSnap = await usersCol.ref
		.where("username", "==", username)
		.limit(1)
		.get();

	if (userSnap.empty) {
		notFound();
	}

	const user = userSnap.docs[0].data();
	const userId = user.numericId;

	// Fetch projects
	const projectsSnap = await projectsCol.ref
		.where("user_id", "==", userId)
		.where("status", "==", "approved")
		.get();
	const projects = projectsSnap.docs.map((d) => d.data());

	// Fetch ratings
	const ratingsSnap = await ratingsCol.ref
		.where("user_id", "==", userId)
		.orderBy("created_at", "desc")
		.get();
	const ratings = await Promise.all(ratingsSnap.docs.map(async (d) => {
		const r = d.data();
		// We need project details for the rating
		const pDoc = await projectsCol.ref.doc(String(r.project_id)).get();
		let projectName = "Unknown Project";
		let projectSlug = "";
		if (pDoc.exists) {
			projectName = pDoc.data()!.name as string;
			projectSlug = pDoc.data()!.slug as string;
		}
		return { ...r, projectName, projectSlug };
	}));

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header */}
			<div className="mb-8 animate-in">
				<div className="flex items-center gap-4 mb-4">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nova to-plasma flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-nova/20 shrink-0">
						{user.username[0].toUpperCase()}
					</div>
					<div>
						<h1 className="font-display font-bold text-3xl text-starlight">
							{user.username}
						</h1>
						<div className="flex items-center gap-3 text-sm text-ash mt-0.5">
							{user.role && <span className="tag tag-nova text-xs">{user.role}</span>}
							{user.created_at && (
								<span>Joined {new Date(user.created_at as string).toLocaleDateString()}</span>
							)}
						</div>
						{user.bio && (
							<p className="mt-2 text-moonlight text-sm max-w-2xl">{user.bio}</p>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in animate-in-delay-1">
				{/* Projects Section */}
				<div>
					<h2 className="font-semibold text-lg text-starlight mb-4 flex items-center gap-2">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nova)" strokeWidth="2">
							<polygon points="12 2 2 7 12 12 22 7 12 2" />
							<polyline points="2 17 12 22 22 17" />
							<polyline points="2 12 12 17 22 12" />
						</svg>
						Submitted Projects ({projects.length})
					</h2>
					{projects.length === 0 ? (
						<div className="glass rounded-2xl p-6 text-center text-sm text-ash">
							No approved projects yet.
						</div>
					) : (
						<div className="space-y-4">
							{projects.map((p, i) => (
								<Link href={`/projects/${p.slug}`} key={i} className="block group">
									<div className="glass rounded-2xl p-5 hover:border-nova/30 transition-all">
										<h3 className="font-medium text-starlight group-hover:text-nova-bright transition-colors">
											{p.name}
										</h3>
										<p className="text-xs text-ash mt-1 line-clamp-2">{p.description}</p>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Ratings Section */}
				<div>
					<h2 className="font-semibold text-lg text-starlight mb-4 flex items-center gap-2">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--solar)" strokeWidth="2">
							<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
						</svg>
						Ratings Given ({ratings.length})
					</h2>
					{ratings.length === 0 ? (
						<div className="glass rounded-2xl p-6 text-center text-sm text-ash">
							No ratings given yet.
						</div>
					) : (
						<div className="space-y-4">
							{ratings.map((r, i) => (
								<div key={i} className="glass rounded-2xl p-5">
									<div className="flex items-center justify-between mb-2">
										<Link href={r.projectSlug ? `/projects/${r.projectSlug}` : "#"} className="font-medium text-sm text-starlight hover:text-nova-bright transition-colors">
											{r.projectName}
										</Link>
										<div className="flex items-center gap-1 text-xs">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--solar)" stroke="none">
												<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
											</svg>
											<span className="font-semibold text-solar-bright">{Number(r.score).toFixed(1)}</span>
										</div>
									</div>
									{r.review_text && (
										<p className="text-xs text-moonlight/80 italic mt-1 line-clamp-3">"{r.review_text}"</p>
									)}
									<p className="text-[10px] text-ash mt-2">
										{new Date(r.created_at as string).toLocaleDateString()}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
