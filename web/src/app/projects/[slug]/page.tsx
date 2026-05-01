"use client";

import {useEffect, useState, use} from "react";
import {useAuth} from "@/context/AuthContext";
import StarRating from "@/components/StarRating";
import Link from "next/link";
import {
	ON_CHAIN_ENABLED,
	rateProjectOnChain,
	explorerTxUrl,
} from "@/lib/ratingContract";

interface Project {
	id: number;
	name: string;
	slug: string;
	description: string;
	category: string;
	status: string;
	featured: number;
	stellar_account_id?: string;
	stellar_contract_id?: string;
	stellar_network?: string;
	tags?: string;
	website_url?: string;
	github_url?: string;
	github_repos?: { label: string; url: string }[];
	user_id: number;
	username?: string;
	created_at: string;
}

interface Rating {
	id: number;
	score: number;
	purpose_score?: number;
	innovation_score?: number;
	usability_score?: number;
	review_text?: string;
	tx_hash?: string;
	username: string;
	user_id: number;
	created_at: string;
}

interface Averages {
	avg_score: number;
	avg_purpose: number;
	avg_innovation: number;
	avg_usability: number;
	total: number;
}

interface FinancialSummary {
	balances: {asset_code: string; balance: string}[];
}

function stellarExplorerBase(network?: string) {
	return network === "testnet"
		? "https://stellar.expert/explorer/testnet"
		: "https://stellar.expert/explorer/public";
}

function StellarAddressLink({address, type, network}: {address: string; type: "account" | "contract"; network?: string}) {
	const path = type === "account" ? "account" : "contract";
	const href = `${stellarExplorerBase(network)}/${path}/${address}`;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="tag tag-plasma font-mono text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:bg-plasma/20 transition-all group"
			title={`View on Stellar Expert: ${address}`}
		>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
				<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
				<polyline points="15 3 21 3 21 9" />
				<line x1="10" y1="14" x2="21" y2="3" />
			</svg>
			{address.slice(0, 8)}...{address.slice(-4)}
		</a>
	);
}

export default function ProjectDetailPage({
	params,
}: {
	params: Promise<{slug: string}>;
}) {
	const {slug} = use(params);
	const {user, token} = useAuth();
	const [project, setProject] = useState<Project | null>(null);
	const [ratings, setRatings] = useState<Rating[]>([]);
	const [averages, setAverages] = useState<Averages | null>(null);
	const [financials, setFinancials] = useState<FinancialSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<
		"overview" | "ratings" | "financials"
	>("overview");

	// Rating form
	const [ratingForm, setRatingForm] = useState({
		score: 0,
		purpose_score: 0,
		innovation_score: 0,
		usability_score: 0,
		review_text: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [ratingMsg, setRatingMsg] = useState("");
	const [ratingStep, setRatingStep] = useState<"idle" | "onchain" | "saving">("idle");
	const [lastTxHash, setLastTxHash] = useState<string | null>(null);

	useEffect(() => {
		fetch(`/api/projects/${slug}`)
			.then((r) => r.json())
			.then((data) => {
				setProject(data.project);
				setRatings(data.ratings || []);
				setAverages(data.averages);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [slug]);

	useEffect(() => {
		if (project?.stellar_account_id) {
			fetch(`/api/financials/${project.id}/summary`)
				.then((r) => r.json())
				.then((data) => {
					if (data.summary) setFinancials(data.summary);
				})
				.catch(() => {});
		}
	}, [project]);

	const submitRating = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!project || !token || ratingForm.score === 0) return;
		setSubmitting(true);
		setRatingMsg("");
		setLastTxHash(null);

		try {
			// 1. On-chain rating (charges user the rating fee via Freighter)
			let txHash: string | null = null;
			if (ON_CHAIN_ENABLED) {
				if (!user?.stellar_address) {
					throw new Error(
						"Link a Stellar wallet in your profile to rate projects. Ratings are recorded on-chain and cost 0.1 USDC.",
					);
				}
				setRatingStep("onchain");
				txHash = await rateProjectOnChain(
					user.stellar_address,
					project.slug,
					ratingForm.score,
				);
				if (txHash) setLastTxHash(txHash);
			}

			// 2. Save rating + tx hash in the off-chain DB for fast queries
			setRatingStep("saving");
			const res = await fetch("/api/ratings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					project_id: project.id,
					...ratingForm,
					tx_hash: txHash,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setRatingMsg(
				txHash
					? "Rating submitted on-chain!"
					: "Rating submitted!",
			);
			const refresh = await fetch(`/api/projects/${slug}`);
			const rd = await refresh.json();
			setRatings(rd.ratings || []);
			setAverages(rd.averages);
			setRatingForm({
				score: 0,
				purpose_score: 0,
				innovation_score: 0,
				usability_score: 0,
				review_text: "",
			});
		} catch (err) {
			setRatingMsg(
				err instanceof Error ? err.message : "Failed to submit",
			);
		}
		setRatingStep("idle");
		setSubmitting(false);
	};

	if (loading) {
		return (
			<div className="max-w-5xl mx-auto px-4 py-12">
				<div className="skeleton h-8 w-64 mb-4 rounded-lg" />
				<div className="skeleton h-4 w-96 mb-8 rounded-lg" />
				<div className="skeleton h-64 rounded-2xl" />
			</div>
		);
	}

	if (!project) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<div className="glass rounded-2xl p-12 text-center">
					<h2 className="text-xl font-semibold text-starlight mb-2">
						Project not found
					</h2>
					<Link href="/explore" className="btn-nova inline-flex mt-4">
						Back to Explore
					</Link>
				</div>
			</div>
		);
	}

	const tags = project.tags ? project.tags.split(",") : [];

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header */}
			<div className="mb-8 animate-in">
				<div className="flex items-start gap-4 mb-4">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center text-2xl font-bold text-nova-bright shrink-0">
						{project.name[0]}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-3 flex-wrap">
							<h1 className="font-display font-bold text-3xl sm:text-4xl text-starlight">
								{project.name}
							</h1>
							{project.featured === 1 && (
								<span className="featured-badge tag tag-solar">
									Featured
								</span>
							)}
						</div>
						<div className="flex items-center gap-3 mt-2 text-sm text-ash">
							<span>by {project.username}</span>
							<span className="text-dust">|</span>
							<span
								className={`tag ${project.category === "defi" ? "tag-plasma" : "tag-nova"}`}
							>
								{project.category}
							</span>
						</div>
					</div>
				</div>

				{/* Score summary */}
				{averages && averages.total > 0 && (
					<div className="flex items-center gap-6 mt-4">
						<div className="flex items-center gap-2">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="var(--solar)"
								stroke="none"
							>
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
							</svg>
							<span className="font-bold text-xl text-solar-bright">
								{Number(averages.avg_score).toFixed(1)}
							</span>
							<span className="text-sm text-ash">
								({averages.total} rating
								{averages.total !== 1 ? "s" : ""})
							</span>
						</div>
					</div>
				)}

				{/* Links */}
				<div className="flex gap-3 mt-5 flex-wrap">
					{project.website_url && (
						<a
							href={project.website_url}
							target="_blank"
							rel="noopener noreferrer"
							className="btn-ghost text-sm !py-1.5 inline-flex items-center gap-1.5"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
							</svg>
							Website
						</a>
					)}
					{project.github_repos && project.github_repos.length > 0 ? (
						project.github_repos.map((repo, i) => (
							<a
								key={i}
								href={repo.url}
								target="_blank"
								rel="noopener noreferrer"
								className="btn-ghost text-sm !py-1.5 inline-flex items-center gap-1.5"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
								</svg>
								{repo.label}
							</a>
						))
					) : project.github_url && (
						<a
							href={project.github_url}
							target="_blank"
							rel="noopener noreferrer"
							className="btn-ghost text-sm !py-1.5 inline-flex items-center gap-1.5"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
							</svg>
							GitHub
						</a>
					)}
					{project.stellar_account_id && (
						<StellarAddressLink address={project.stellar_account_id} type="account" network={project.stellar_network} />
					)}
					{project.stellar_contract_id && (
						<StellarAddressLink address={project.stellar_contract_id} type="contract" network={project.stellar_network} />
					)}
				</div>
			</div>

			{/* Website Preview */}
			{project.website_url && (
				<div className="mb-8 animate-in animate-in-delay-1">
					<div className="glass rounded-2xl overflow-hidden">
						<div className="flex items-center gap-2 px-5 py-3 border-b border-dust/20">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 rounded-full bg-supernova/40" />
								<div className="w-3 h-3 rounded-full bg-solar/40" />
								<div className="w-3 h-3 rounded-full bg-aurora/40" />
							</div>
							<div className="flex-1 mx-3">
								<div className="bg-nebula/80 rounded-lg px-3 py-1.5 text-xs text-ash font-mono truncate">
									{project.website_url}
								</div>
							</div>
							<a
								href={project.website_url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-ash hover:text-nova-bright transition-colors flex items-center gap-1"
							>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
								Open
							</a>
						</div>
						<div className="relative bg-nebula">
							<iframe
								src={project.website_url}
								title={`${project.name} website preview`}
								className="w-full h-[400px] sm:h-[500px] border-0"
								sandbox="allow-scripts allow-same-origin allow-popups"
								loading="lazy"
							/>
							<div className="absolute inset-0 pointer-events-none border border-dust/10 rounded-b-2xl" />
						</div>
					</div>
				</div>
			)}

			{/* Tabs */}
			<div className="flex gap-1 mb-8 border-b border-dust/20 animate-in animate-in-delay-2">
				{(["overview", "ratings", "financials"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`px-5 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
							activeTab === tab
								? "border-nova text-nova-bright"
								: "border-transparent text-ash hover:text-moonlight"
						}`}
					>
						{tab}
						{tab === "ratings" && averages
							? ` (${averages.total})`
							: ""}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="animate-in animate-in-delay-3">
				{activeTab === "overview" && (
					<div className="space-y-8">
						<div className="glass rounded-2xl p-8">
							<h2 className="font-semibold text-lg text-starlight mb-4">
								About
							</h2>
							<p className="text-moonlight/90 leading-relaxed whitespace-pre-wrap">
								{project.description}
							</p>
						</div>

						{/* Stellar addresses section */}
						{(project.stellar_account_id || project.stellar_contract_id) && (
							<div className="glass rounded-2xl p-8">
								<h2 className="font-semibold text-lg text-starlight mb-4">
									On-Chain Details
								</h2>
								<div className="space-y-4">
									{project.stellar_account_id && (
										<div>
											<p className="text-xs text-ash uppercase tracking-wider mb-2">Stellar Account</p>
											<a
												href={`${stellarExplorerBase(project.stellar_network)}/account/${project.stellar_account_id}`}
												target="_blank"
												rel="noopener noreferrer"
												className="font-mono text-sm text-plasma-bright hover:text-plasma break-all inline-flex items-start gap-2 group transition-colors"
											>
												{project.stellar_account_id}
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
													<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
													<polyline points="15 3 21 3 21 9" />
													<line x1="10" y1="14" x2="21" y2="3" />
												</svg>
											</a>
										</div>
									)}
									{project.stellar_contract_id && (
										<div>
											<p className="text-xs text-ash uppercase tracking-wider mb-2">Soroban Contract</p>
											<a
												href={`${stellarExplorerBase(project.stellar_network)}/contract/${project.stellar_contract_id}`}
												target="_blank"
												rel="noopener noreferrer"
												className="font-mono text-sm text-plasma-bright hover:text-plasma break-all inline-flex items-start gap-2 group transition-colors"
											>
												{project.stellar_contract_id}
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
													<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
													<polyline points="15 3 21 3 21 9" />
													<line x1="10" y1="14" x2="21" y2="3" />
												</svg>
											</a>
										</div>
									)}
								</div>
							</div>
						)}

						{tags.length > 0 && (
							<div className="glass rounded-2xl p-8">
								<h2 className="font-semibold text-lg text-starlight mb-4">
									Tags
								</h2>
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1.5 rounded-lg bg-stardust/80 text-moonlight text-sm font-medium"
										>
											{tag.trim()}
										</span>
									))}
								</div>
							</div>
						)}

						{averages && averages.total > 0 && (
							<div className="glass rounded-2xl p-8">
								<h2 className="font-semibold text-lg text-starlight mb-6">
									Rating Breakdown
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{[
										{
											label: "Overall",
											value: averages.avg_score,
										},
										{
											label: "Purpose",
											value: averages.avg_purpose,
										},
										{
											label: "Innovation",
											value: averages.avg_innovation,
										},
										{
											label: "Usability",
											value: averages.avg_usability,
										},
									].map((item) => (
										<div
											key={item.label}
											className="flex items-center justify-between bg-stardust/30 rounded-xl px-5 py-4"
										>
											<span className="text-sm font-medium text-moonlight">
												{item.label}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-24 h-2 bg-dust/40 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-nova to-plasma rounded-full transition-all"
														style={{
															width: `${((Number(item.value) || 0) / 5) * 100}%`,
														}}
													/>
												</div>
												<span className="text-sm font-mono text-nova-bright font-semibold">
													{Number(
														item.value || 0,
													).toFixed(1)}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === "ratings" && (
					<div className="space-y-8">
						{/* Submit rating form */}
						{user && user.id !== project.user_id && (
							<form
								onSubmit={submitRating}
								className="glass rounded-2xl p-8 space-y-5"
							>
								<div>
									<h2 className="font-semibold text-lg text-starlight">
										Rate this project
									</h2>
									{ON_CHAIN_ENABLED && (
										<p className="text-xs text-ash mt-1">
											Ratings are recorded on-chain. Each rating costs{" "}
											<span className="text-solar-bright font-semibold">0.1 USDC</span>{" "}
											and requires a linked Stellar wallet.
										</p>
									)}
								</div>
								{ON_CHAIN_ENABLED && user && !user.stellar_address && (
									<div className="rounded-xl px-4 py-3 text-sm bg-solar/10 border border-solar/20 text-solar-bright">
										You need to{" "}
										<Link href="/profile" className="underline font-medium">
											link a Stellar wallet
										</Link>{" "}
										before rating.
									</div>
								)}
								{ratingMsg && (
									<div
										className={`rounded-xl px-4 py-3 text-sm ${ratingMsg.includes("submitted") ? "bg-aurora/10 border border-aurora/20 text-aurora-bright" : "bg-supernova/10 border border-supernova/20 text-supernova"}`}
									>
										{ratingMsg}
										{lastTxHash && (
											<>
												{" "}
												<a
													href={explorerTxUrl(lastTxHash)}
													target="_blank"
													rel="noopener noreferrer"
													className="underline font-mono text-xs"
												>
													View tx
												</a>
											</>
										)}
									</div>
								)}
								<StarRating
									label="Overall"
									value={ratingForm.score}
									onChange={(v) =>
										setRatingForm((p) => ({...p, score: v}))
									}
								/>
								<StarRating
									label="Purpose"
									value={ratingForm.purpose_score}
									onChange={(v) =>
										setRatingForm((p) => ({
											...p,
											purpose_score: v,
										}))
									}
								/>
								<StarRating
									label="Innovation"
									value={ratingForm.innovation_score}
									onChange={(v) =>
										setRatingForm((p) => ({
											...p,
											innovation_score: v,
										}))
									}
								/>
								<StarRating
									label="Usability"
									value={ratingForm.usability_score}
									onChange={(v) =>
										setRatingForm((p) => ({
											...p,
											usability_score: v,
										}))
									}
								/>
								<div>
									<label className="block text-sm font-medium text-moonlight mb-2">
										Review (optional)
									</label>
									<textarea
										rows={3}
										className="input-field resize-none"
										placeholder="Share your thoughts..."
										value={ratingForm.review_text}
										onChange={(e) =>
											setRatingForm((p) => ({
												...p,
												review_text: e.target.value,
											}))
										}
									/>
								</div>
								<button
									type="submit"
									disabled={
										submitting ||
										ratingForm.score === 0 ||
										(ON_CHAIN_ENABLED && !user?.stellar_address)
									}
									className="btn-nova disabled:opacity-50"
								>
									{ratingStep === "onchain"
										? "Confirm in wallet (0.1 USDC)..."
										: ratingStep === "saving"
											? "Saving..."
											: ON_CHAIN_ENABLED
												? "Submit Rating (0.1 USDC)"
												: "Submit Rating"}
								</button>
							</form>
						)}

						{/* Existing ratings */}
						{ratings.length > 0 ? (
							<div className="space-y-4">
								{ratings.map((rating) => (
									<div
										key={rating.id}
										className="glass rounded-2xl p-6"
									>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-gradient-to-br from-nova/40 to-comet/40 flex items-center justify-center text-xs font-bold text-white">
													{rating.username[0].toUpperCase()}
												</div>
												<div>
													<span className="font-medium text-starlight text-sm">
														{rating.username}
													</span>
													<p className="text-xs text-ash">
														{new Date(
															rating.created_at,
														).toLocaleDateString()}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-1">
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="var(--solar)"
													stroke="none"
												>
													<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
												</svg>
												<span className="font-semibold text-solar-bright">
													{rating.score}
												</span>
											</div>
										</div>
										{rating.review_text && (
											<p className="text-sm text-moonlight/80 leading-relaxed">
												{rating.review_text}
											</p>
										)}
										<div className="flex gap-4 mt-3 text-xs text-ash flex-wrap items-center">
											{rating.purpose_score && (
												<span>
													Purpose:{" "}
													{rating.purpose_score}/5
												</span>
											)}
											{rating.innovation_score && (
												<span>
													Innovation:{" "}
													{rating.innovation_score}/5
												</span>
											)}
											{rating.usability_score && (
												<span>
													Usability:{" "}
													{rating.usability_score}/5
												</span>
											)}
											{rating.tx_hash && (
												<a
													href={explorerTxUrl(rating.tx_hash)}
													target="_blank"
													rel="noopener noreferrer"
													className="tag tag-plasma text-[10px] inline-flex items-center gap-1"
													title={`On-chain tx: ${rating.tx_hash}`}
												>
													<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M12 2L2 7l10 5 10-5-10-5z" />
														<path d="M2 17l10 5 10-5" />
														<path d="M2 12l10 5 10-5" />
													</svg>
													On-chain
												</a>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="glass rounded-2xl p-12 text-center">
								<p className="text-ash">
									No ratings yet. Be the first to rate this
									project!
								</p>
							</div>
						)}
					</div>
				)}

				{activeTab === "financials" && (
					<div className="space-y-6">
						{!project.stellar_account_id ? (
							<div className="glass rounded-2xl p-12 text-center">
								<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="none"
										stroke="var(--ash)"
										strokeWidth="1.5"
									>
										<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
									</svg>
								</div>
								<h3 className="font-semibold text-lg text-moonlight mb-2">
									No Stellar account linked
								</h3>
								<p className="text-ash">
									This project hasn&apos;t linked a Stellar
									account for on-chain tracking.
								</p>
							</div>
						) : (
							<>
								{financials ? (
									<div className="glass rounded-2xl p-8">
										<h2 className="font-semibold text-lg text-starlight mb-6">
											Account Balances
										</h2>
										<div className="space-y-3">
											{financials.balances.map((b, i) => (
												<div
													key={i}
													className="flex items-center justify-between bg-stardust/30 rounded-xl px-5 py-4"
												>
													<span className="font-medium text-moonlight">
														{b.asset_code}
													</span>
													<span className="font-mono text-plasma-bright font-semibold">
														{Number(
															b.balance,
														).toLocaleString()}
													</span>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="glass rounded-2xl p-8">
										<div className="skeleton h-6 w-40 mb-4 rounded" />
										<div className="space-y-3">
											<div className="skeleton h-14 rounded-xl" />
											<div className="skeleton h-14 rounded-xl" />
										</div>
									</div>
								)}
								<div className="glass rounded-2xl p-8">
									<h2 className="font-semibold text-lg text-starlight mb-2">
										Stellar Account
									</h2>
									<a
										href={`${stellarExplorerBase(project.stellar_network)}/account/${project.stellar_account_id}`}
										target="_blank"
										rel="noopener noreferrer"
										className="font-mono text-sm text-plasma-bright hover:text-plasma break-all inline-flex items-start gap-2 group transition-colors"
									>
										{project.stellar_account_id}
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
											<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
											<polyline points="15 3 21 3 21 9" />
											<line x1="10" y1="14" x2="21" y2="3" />
										</svg>
									</a>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
