"use client";

import {useEffect, useMemo, useState, use, type ReactNode} from "react";
import dynamic from "next/dynamic";
import {useAuth} from "@/context/AuthContext";
import StarRating from "@/components/StarRating";
import VerifiedOnChainBadge from "@/components/VerifiedOnChainBadge";
import EmbedSnippet from "@/components/EmbedSnippet";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import {apiFetch, isApiFetchError} from "@/lib/api-fetch";
import {useRetryCountdown} from "@/lib/use-retry-countdown";
import {notFound} from "next/navigation";
import Image from "next/image";
import {MAX_REVIEW_TEXT_LENGTH} from "@/lib/validation/constants";

import {
	ON_CHAIN_ENABLED,
	rateProjectOnChain,
	explorerTxUrl,
	explorerAccountUrl,
	explorerContractUrl,
	getRatingFee,
	hasRatedOnChain,
	getProjectRatingFromEvents,
	isRegisteredOnChain,
	type OnChainRating,
} from "@/lib/ratingContract";
import {Textarea} from "@/components/ui/textarea";
import {PROJECT_REPORT_REASONS} from "@/lib/validation/schemas/reports";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";
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
	logo_url?: string;
	owner_verified_at?: string | null;
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
	avatar_url?: string | null;
	user_id: number;
	created_at: string;
	helpful_count?: number;
	has_voted?: boolean;
	owner_reply?: string | null;
	owner_reply_at?: string | null;
}

interface Averages {
	avg_score: number;
	avg_purpose: number;
	avg_innovation: number;
	avg_usability: number;
	total: number;
}

interface FinancialSummary {
	balances: {
		asset_type: string;
		asset_code: string;
		asset_issuer?: string;
		balance: string;
	}[];
}

const ProjectQr = dynamic(() => import("@/components/ProjectQr"), {ssr: false});
function StellarAddressLink({address, type, network}: {address: string; type: "account" | "contract"; network?: string}) {
	const href = type === "account"
		? explorerAccountUrl(address, network)
		: explorerContractUrl(address, network);
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

/** Format a raw i128 stroop amount as a human-readable token string (6 dp). */
function formatFee(stroops: bigint | null): string {
	if (stroops === null) return "0.1 USDC";
	const usdc = Number(stroops) / 1_000_000;
	return `${usdc.toFixed(usdc < 0.01 ? 6 : 2)} USDC`;
}

interface GithubStats {
	stars: number;
	forks: number;
	openIssues: number;
	lastCommit: string | null;
	license: string | null;
}


function renderInlineMarkdown(text: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	const pattern =
		/\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_/g;
	let lastIndex = 0;
	let key = 0;

	for (const match of text.matchAll(pattern)) {
		const index = match.index;
		nodes.push(text.slice(lastIndex, index));
		const [, linkText, href, code, boldAsterisk, boldUnderscore, strike, italicAsterisk, italicUnderscore] = match;

		if (linkText && href) {
			const safeHref = /^https?:\/\//i.test(href) ? href : null;

			nodes.push(
				safeHref ? (
					<a
						key={key++}
						href={safeHref}
						target="_blank"
						rel="noopener noreferrer nofollow"
						className="text-plasma-bright underline underline-offset-2"
					>
						{linkText}
					</a>
				) : (
					match[0]
				),
			);
		} else if (code) {
			nodes.push(
				<code key={key++} className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">
					{code}
				</code>,
			);
		} else if (boldAsterisk || boldUnderscore) {
			nodes.push(<strong key={key++}>{boldAsterisk || boldUnderscore}</strong>);
		} else if (strike) {
			nodes.push(<del key={key++}>{strike}</del>);
		} else if (italicAsterisk || italicUnderscore) {
			nodes.push(<em key={key++}>{italicAsterisk || italicUnderscore}</em>);
		}

		lastIndex = index + match[0].length;
	}

	nodes.push(text.slice(lastIndex));
	return nodes;
}

function renderReviewMarkdown(markdown: string): ReactNode {
	const lines = markdown.split(/\r?\n/);
	const blocks: ReactNode[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index++;
			continue;
		}

		if (/^\s*```/.test(line)) {
			const codeLines: string[] = [];
			index++;
			while (index < lines.length && !/^\s*```/.test(lines[index])) {
				codeLines.push(lines[index++]);
			}
			if (index < lines.length) index++;
			blocks.push(
				<pre key={blocks.length} className="overflow-x-auto rounded-lg bg-black/20 p-3">
					<code>{codeLines.join("\n")}</code>
				</pre>,
			);
			continue;
		}

		const heading = /^(#{1,6})\s+(.+)$/.exec(line);
		if (heading) {
			const Heading = (
				["h1", "h2", "h3", "h4", "h5", "h6"] as const
			)[heading[1].length - 1];
			blocks.push(
				<Heading key={blocks.length} className="font-semibold text-starlight">
					{renderInlineMarkdown(heading[2])}
				</Heading>,
			);
			index++;
			continue;
		}

		if (/^\s*>/.test(line)) {
			const quoteLines: string[] = [];
			while (index < lines.length && /^\s*>/.test(lines[index])) {
				quoteLines.push(lines[index++].replace(/^\s*>\s?/, ""));
			}
			blocks.push(
				<blockquote
					key={blocks.length}
					className="border-l-2 border-plasma/50 pl-3 text-moonlight/70"
				>
					{quoteLines.map((quoteLine, lineIndex) => (
						<span key={lineIndex}>
							{lineIndex > 0 && <br />}
							{renderInlineMarkdown(quoteLine)}
						</span>
					))}
				</blockquote>,
			);
			continue;
		}

		const unordered = /^\s*[-*+]\s+(.+)$/.test(line);
		const ordered = /^\s*\d+\.\s+(.+)$/.test(line);
		if (unordered || ordered) {
			const List = ordered ? "ol" : "ul";
			const items: string[] = [];
			const itemPattern = ordered
				? /^\s*\d+\.\s+(.+)$/
				: /^\s*[-*+]\s+(.+)$/;
			while (index < lines.length) {
				const item = itemPattern.exec(lines[index]);
				if (!item) break;
				items.push(item[1]);
				index++;
			}
			blocks.push(
				<List
					key={blocks.length}
					className={ordered ? "list-decimal pl-5" : "list-disc pl-5"}
				>
					{items.map((item, itemIndex) => (
						<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
					))}
				</List>,
			);
			continue;
		}

		const paragraph: string[] = [];
		while (
			index < lines.length &&
			lines[index].trim() &&
			!/^\s*```/.test(lines[index]) &&
			!/^(#{1,6})\s+/.test(lines[index]) &&
			!/^\s*>/.test(lines[index]) &&
			!/^\s*[-*+]\s+/.test(lines[index]) &&
			!/^\s*\d+\.\s+/.test(lines[index])
		) {
			paragraph.push(lines[index++]);
		}
		blocks.push(
			<p key={blocks.length}>
				{paragraph.map((paragraphLine, lineIndex) => (
					<span key={lineIndex}>
						{lineIndex > 0 && <br />}
						{renderInlineMarkdown(paragraphLine)}
					</span>
				))}
			</p>,
		);
	}

	return <div className="space-y-2">{blocks}</div>;
}

/** Count ratings per whole star (5..1); always returns all five keys. */
function countStarDistribution(ratings: {score: number}[]): Record<number, number> {
	const counts: Record<number, number> = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
	for (const r of ratings) {
		const stars = Math.round(Number(r.score));
		if (stars >= 1 && stars <= 5) counts[stars]++;
	}
	return counts;
}

type ReviewSort = "helpful" | "recent" | "highest" | "lowest";

const REVIEW_SORT_OPTIONS: {value: ReviewSort; label: string}[] = [
	{value: "helpful", label: "Most Helpful"},
	{value: "recent", label: "Newest"},
	{value: "highest", label: "Highest rated"},
	{value: "lowest", label: "Lowest rated"},
];

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
	const [githubStats, setGithubStats] = useState<GithubStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [missing, setMissing] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"overview" | "ratings" | "financials"
	>("overview");

	// On-chain state
	const [contractRatingFee, setContractRatingFee] = useState<bigint | null>(null);
	const [alreadyRatedOnChain, setAlreadyRatedOnChain] = useState(false);
	const [onChainRating, setOnChainRating] = useState<OnChainRating | null>(null);
	// true = project exists in registry; false = not registered (rating goes off-chain only)
	const [isOnChainProject, setIsOnChainProject] = useState(false);

	// Rating form
	const [ratingForm, setRatingForm] = useState({
		score: 0,
		purpose_score: 0,
		innovation_score: 0,
		usability_score: 0,
		review_text: "",
	});
	const [submitting, setSubmitting] = useState(false);
	// On-chain ratings cost a fee: confirm it before the wallet is asked to sign (#493).
	const [showFeeConfirm, setShowFeeConfirm] = useState(false);
	const [ratingMsg, setRatingMsg] = useState("");
	const {
		remainingSeconds,
		start: startRetryCountdown,
		clear: clearRetryCountdown,
	} = useRetryCountdown();
	const [ratingStep, setRatingStep] = useState<"idle" | "onchain" | "saving">("idle");
	const [lastTxHash, setLastTxHash] = useState<string | null>(null);
	const [badgeCopied, setBadgeCopied] = useState(false);

	// Report review state
	const [reportingId, setReportingId] = useState<number | null>(null);
	const [reportReason, setReportReason] = useState("spam");
	const [reportBusy, setReportBusy] = useState(false);
	const [reportMsg, setReportMsg] = useState("");
	const [reportedIds, setReportedIds] = useState<number[]>([]);

	// Review ordering and helpful votes (#213)
	const [reviewSort, setReviewSort] = useState<ReviewSort>("helpful");
	const [votingRatingId, setVotingRatingId] = useState<number | null>(null);
	const sortedRatings = useMemo(() => {
		const sorted = [...ratings];
		sorted.sort((a, b) => {
			const timeA = Date.parse(a.created_at) || 0;
			const timeB = Date.parse(b.created_at) || 0;
			const helpfulDifference = (b.helpful_count ?? 0) - (a.helpful_count ?? 0);

			if (reviewSort === "recent") return timeB - timeA;
			if (reviewSort === "highest") {
				return b.score - a.score || helpfulDifference || timeB - timeA;
			}
			if (reviewSort === "lowest") {
				return a.score - b.score || helpfulDifference || timeB - timeA;
			}
			return helpfulDifference || timeB - timeA;
		});
		return sorted;
	}, [ratings, reviewSort]);

	// Owner reply editor (#529)
	const [editingReplyRatingId, setEditingReplyRatingId] = useState<number | null>(null);
	const [replyDraft, setReplyDraft] = useState("");
	const [replyError, setReplyError] = useState<string | null>(null);
	const [replySubmitting, setReplySubmitting] = useState(false);

	// Bumped to refetch the project + ratings (e.g. after submitting a rating).
	const [reloadKey, setReloadKey] = useState(0);

	// 5 -> 1 star breakdown (#521)
	const [distribution, setDistribution] = useState<Record<number, number>>(countStarDistribution([]));
	// Report project state
	const [projectReportOpen, setProjectReportOpen] = useState(false);
	const [projectReportReason, setProjectReportReason] = useState<string>("spam");
	const [projectReportNote, setProjectReportNote] = useState("");
	const [projectReportBusy, setProjectReportBusy] = useState(false);
	const [projectReportMsg, setProjectReportMsg] = useState("");
	const [projectReportSuccess, setProjectReportSuccess] = useState(false);
	const [hasReportedProject, setHasReportedProject] = useState(false);

	useEffect(() => {
		if (!token || !project) return;
		let ignore = false;
		fetch(`/api/reports?target_type=project&target_id=${project.id}`, {
			headers: {Authorization: `Bearer ${token}`},
		})
			.then((r) => r.json())
			.then((data) => {
				if (!ignore && data?.hasOpenReport) setHasReportedProject(true);
			})
			.catch(() => {});
		return () => {
			ignore = true;
		};
	}, [project, token]);

	useEffect(() => {
		let cancelled = false;
		// Signed-in requests get has_voted per review.
		fetch(`/api/projects/${slug}`, {
			headers: token ? {Authorization: `Bearer ${token}`} : undefined,
		})
			.then((r) => {
				if (r.status === 404 && !cancelled) setMissing(true);
				return r.json();
			})
			.then((data) => {
				if (cancelled) return;
				setProject(data.project);
				setRatings(data.ratings || []);
				setAverages(data.averages);
				// Deep links from the admin reports inbox (#rating-<id>) open the Ratings tab.
				if (/^#rating-\d+$/.test(window.location.hash)) setActiveTab("ratings");
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug, token, reloadKey]);

	const handleVoteHelpful = async (ratingId: number, currentlyVoted: boolean) => {
		if (!token) {
			alert("Please log in to vote on reviews.");
			return;
		}

		setVotingRatingId(ratingId);
		try {
			const method = currentlyVoted ? "DELETE" : "POST";
			const res = await fetch(`/api/ratings/${ratingId}/vote`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || "Failed to update vote");
				return;
			}

			// Update rating item in local state
			setRatings((prev) =>
				prev.map((r) => {
					if (r.id === ratingId) {
						return {
							...r,
							helpful_count: data.helpful_count,
							has_voted: data.has_voted,
						};
					}
					return r;
				})
			);
		} catch (err) {
			console.error("Failed to vote:", err);
		} finally {
			setVotingRatingId(null);
		}
	};

	useEffect(() => {
		if (!project?.id) return;
		let cancelled = false;
		fetch(`/api/ratings/project/${project.id}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data && !cancelled) setDistribution(countStarDistribution(data.ratings || []));
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [project?.id, reloadKey]);

	useEffect(() => {
		if (activeTab !== "ratings" || !ratings.length) return;
		const ratingId = window.location.hash.match(/^#rating-\d+$/)?.[0].slice(1);
		if (ratingId) {
			document.getElementById(ratingId)?.scrollIntoView({ behavior: "smooth" });
		}
	}, [activeTab, ratings]);

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

	// Fetch GitHub repo stats (hidden on error)
	useEffect(() => {
		if (!project?.github_url) return;
		fetch(`/api/projects/${project.id}/github`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) setGithubStats(data);
			})
			.catch(() => {});
	}, [project]);

	// Fetch registration status, rating fee, and on-chain aggregate
	useEffect(() => {
		if (!ON_CHAIN_ENABLED || !project) return;

		isRegisteredOnChain(project.slug)
			.then((registered) => {
				setIsOnChainProject(registered);
				if (registered) {
					// Only fetch fee and aggregate if actually registered
					getRatingFee().then(setContractRatingFee).catch(() => {});
					getProjectRatingFromEvents(project.slug).then(setOnChainRating).catch(() => {});
				}
			})
			.catch(() => {});
	}, [project]);

	// Check if the current user has already rated on-chain (only if project is registered)
	useEffect(() => {
		if (!ON_CHAIN_ENABLED || !isOnChainProject || !project || !user?.stellar_address) return;
		hasRatedOnChain(user.stellar_address, project.slug)
			.then((rated) => setAlreadyRatedOnChain(rated))
			.catch(() => {});
	}, [isOnChainProject, project, user]);

	const submitReport = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!token || reportingId === null) return;
		setReportBusy(true);
		setReportMsg("");
		try {
			const res = await fetch("/api/reports", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					target_type: "rating",
					target_id: reportingId,
					reason: reportReason,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setReportedIds((p) => [...p, reportingId]);
			setReportingId(null);
			setReportReason("spam");
		} catch (err) {
			setReportMsg(err instanceof Error ? err.message : "Failed to report");
		}
		setReportBusy(false);
	};

	const submitProjectReport = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!token || !project) return;
		setProjectReportBusy(true);
		setProjectReportMsg("");

		try {
			const res = await fetch("/api/reports", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					target_type: "project",
					target_id: project.id,
					reason: projectReportReason,
					note: projectReportNote.trim() || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to report project");

			setHasReportedProject(true);
			setProjectReportSuccess(true);
			setTimeout(() => {
				setProjectReportOpen(false);
				setProjectReportSuccess(false);
				setProjectReportNote("");
				setProjectReportReason("spam");
			}, 1500);
		} catch (err) {
			setProjectReportMsg(err instanceof Error ? err.message : "Failed to report project");
		} finally {
			setProjectReportBusy(false);
		}
	};

	const submitRating = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!project || !token || ratingForm.score === 0) return;
		if (onChainActive) {
			setShowFeeConfirm(true);
			return;
		}
		void performRating();
	};

	const performRating = async () => {
		if (!project || !token || ratingForm.score === 0) return;
		setSubmitting(true);
		setRatingMsg("");
		clearRetryCountdown();
		setLastTxHash(null);

		try {
			let txHash: string | null = null;
			if (ON_CHAIN_ENABLED && isOnChainProject) {
				if (!user?.stellar_address) {
					throw new Error(
						"Link a Stellar wallet in your profile to rate projects on-chain.",
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

			setRatingStep("saving");
			await apiFetch("/api/ratings", {
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

			setRatingMsg(txHash ? "Rating submitted on-chain!" : "Rating submitted!");

			// Refresh off-chain ratings
			setReloadKey((key) => key + 1);

			// Refresh on-chain aggregate
			if (onChainActive) {
				getProjectRatingFromEvents(project.slug)
					.then((r) => setOnChainRating(r))
					.catch(() => {});
				setAlreadyRatedOnChain(true);
			}

			setRatingForm({
				score: 0,
				purpose_score: 0,
				innovation_score: 0,
				usability_score: 0,
				review_text: "",
			});
		} catch (err) {
			if (isApiFetchError(err) && err.status === 429) {
				startRetryCountdown(err.retryAfterSeconds ?? 1);
			} else {
				setRatingMsg(err instanceof Error ? err.message : "Failed to submit");
			}
		}
		setRatingStep("idle");
		setSubmitting(false);
	};

	const startReplyEdit = (ratingId: number, currentReply?: string | null) => {
		setEditingReplyRatingId(ratingId);
		setReplyDraft(currentReply || "");
		setReplyError(null);
	};

	const cancelReplyEdit = () => {
		setEditingReplyRatingId(null);
		setReplyDraft("");
		setReplyError(null);
	};

	const handleSaveReply = async (ratingId: number) => {
		if (!token || !replyDraft.trim()) return;
		setReplySubmitting(true);
		setReplyError(null);
		try {
			const res = await fetch(`/api/ratings/${ratingId}/reply`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ owner_reply: replyDraft.trim() }),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to save reply");
			}
			setRatings((prev) =>
				prev.map((r) =>
					r.id === ratingId
						? {
								...r,
								owner_reply: replyDraft.trim(),
								owner_reply_at: data.owner_reply_at || new Date().toISOString(),
							}
						: r
				)
			);
			setEditingReplyRatingId(null);
			setReplyDraft("");
		} catch (err) {
			setReplyError(err instanceof Error ? err.message : "Failed to save reply");
		} finally {
			setReplySubmitting(false);
		}
	};

	const handleDeleteReply = async (ratingId: number) => {
		if (!token || !window.confirm("Are you sure you want to delete this reply?")) return;
		setReplySubmitting(true);
		setReplyError(null);
		try {
			const res = await fetch(`/api/ratings/${ratingId}/reply`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to delete reply");
			}
			setRatings((prev) =>
				prev.map((r) =>
					r.id === ratingId
						? { ...r, owner_reply: null, owner_reply_at: null }
						: r
				)
			);
			if (editingReplyRatingId === ratingId) {
				cancelReplyEdit();
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete reply");
		} finally {
			setReplySubmitting(false);
		}
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

	// Unknown slug — render the segment's branded not-found.tsx
	if (missing) notFound();

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
	const onChainActive = ON_CHAIN_ENABLED && isOnChainProject;
	const feeLabel = formatFee(onChainActive ? contractRatingFee : null);
	const canRate = user && user.id !== project.user_id && !alreadyRatedOnChain;
	const isOwner = Boolean(user && project && user.id === project.user_id);

	// Average sub-scores across ratings, ignoring null/undefined values.
	const subScoreAverages = (() => {
		const fields = ["purpose_score", "innovation_score", "usability_score"] as const;
		const result: Record<(typeof fields)[number], number | null> = {
			purpose_score: null,
			innovation_score: null,
			usability_score: null,
		};
		for (const field of fields) {
			const values = ratings
				.map((r) => r[field])
				.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
			if (values.length > 0) {
				result[field] = values.reduce((sum, v) => sum + v, 0) / values.length;
			}
		}
		return result;
	})();

	const badgeSnippet = `[![Stellar Wave Hub](${siteUrl}/api/badge/${project.slug}.svg)](${siteUrl}/projects/${project.slug})`;
	const copyBadge = async () => {
		try {
			await navigator.clipboard.writeText(badgeSnippet);
			setBadgeCopied(true);
			setTimeout(() => setBadgeCopied(false), 2000);
		} catch {
			setBadgeCopied(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header */}
			<div className="mb-8 animate-in">
				<div className="flex items-start gap-4 mb-4">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center text-2xl font-bold text-nova-bright shrink-0 overflow-hidden">
					{project.logo_url ? (
						<Image
							src={project.logo_url}
							alt={`${project.name} logo`}
							width={64}
							height={64}
							className="w-full h-full object-cover"
						/>
					) : (
						project.name[0]
					)}
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
							{isOnChainProject && process.env.NEXT_PUBLIC_CONTRACT_ID && (
								<a
									href={explorerContractUrl(process.env.NEXT_PUBLIC_CONTRACT_ID, process.env.NEXT_PUBLIC_CONTRACT_NETWORK)}
									target="_blank"
									rel="noopener noreferrer"
									className="tag tag-aurora inline-flex items-center gap-1.5 cursor-pointer hover:bg-aurora/20 transition-all"
									title="This project is registered on-chain"
								>
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
										<path d="M12 2L2 7l10 5 10-5-10-5z" />
										<path d="M2 17l10 5 10-5" />
										<path d="M2 12l10 5 10-5" />
									</svg>
									Registered on-chain
								</a>
							)}
							<VerifiedBadge
								verifiedAt={project.owner_verified_at}
								account={project.stellar_account_id}
							/>
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

				{/* Score summary — off-chain average + on-chain aggregate */}
				<div className="flex items-center gap-6 mt-4 flex-wrap">
					{averages && averages.total > 0 && (
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
								({averages.total} rating{averages.total !== 1 ? "s" : ""})
							</span>
						</div>
					)}
					{onChainActive && onChainRating && onChainRating.count > 0 && (
						<div className="flex items-center gap-1.5 text-sm text-ash">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
								<path d="M12 2L2 7l10 5 10-5-10-5z" />
								<path d="M2 17l10 5 10-5" />
								<path d="M2 12l10 5 10-5" />
							</svg>
							<span className="text-plasma-bright font-semibold">
								{onChainRating.average.toFixed(1)}
							</span>
							<span>on-chain ({onChainRating.count})</span>
						</div>
					)}
				</div>

				{/* Sub-score summary bars */}
				{ratings.length > 0 && (
					<div className="mt-5 space-y-2.5 max-w-md">
						{(
							[
								{label: "Purpose", value: subScoreAverages.purpose_score},
								{label: "Innovation", value: subScoreAverages.innovation_score},
								{label: "Usability", value: subScoreAverages.usability_score},
							] as const
						).map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<span className="text-xs font-medium text-ash w-20 shrink-0">
									{item.label}
								</span>
								<div className="flex-1 h-2 bg-dust/40 rounded-full overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-nova to-plasma rounded-full transition-all"
										style={{
											width: `${((item.value ?? 0) / 5) * 100}%`,
										}}
									/>
								</div>
								<span className="text-xs font-mono text-nova-bright font-semibold w-8 text-right shrink-0">
									{item.value === null ? "—" : item.value.toFixed(1)}
								</span>
							</div>
						))}
					</div>
				)}

				{/* Links */}
				<div className="flex gap-3 mt-5 flex-wrap items-center justify-between">
					<div className="flex gap-3 flex-wrap items-center">
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

					{/* Project Report Button */}
					{(!user || user.id !== project.user_id) && (
						<div className="flex items-center">
							{hasReportedProject ? (
								<button
									type="button"
									disabled
									className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 border-supernova/30 text-supernova opacity-80 cursor-default"
									title="You already have an open report for this project"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
										<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
										<line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" />
									</svg>
									Reported
								</button>
							) : (
								<button
									type="button"
									onClick={() => {
										setProjectReportMsg("");
										setProjectReportSuccess(false);
										setProjectReportOpen(true);
									}}
									className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 text-ash hover:text-supernova hover:border-supernova/40 transition-colors"
									aria-label="Report project"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
										<line x1="4" y1="22" x2="4" y2="15" />
									</svg>
									Report project
								</button>
							)}
						</div>
					)}
				</div>

				{/* QR code for event booths and slides */}
				<div className="mt-6">
					<ProjectQr
						url={new URL(`/projects/${project.slug}`, process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).toString()}
						name={project.name}
					/>
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

						{githubStats && (
							<div className="glass rounded-2xl p-8">
								<h2 className="font-semibold text-lg text-starlight mb-4">
									GitHub Stats
								</h2>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-solar-bright">{githubStats.stars}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Stars</p>
									</div>
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-nova-bright">{githubStats.forks}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Forks</p>
									</div>
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-plasma-bright">{githubStats.openIssues}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Open Issues</p>
									</div>
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-sm font-semibold text-aurora-bright">
											{githubStats.license || "N/A"}
										</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">License</p>
									</div>
								</div>
								{githubStats.lastCommit && (
									<p className="text-xs text-ash mt-4">
										Last commit:{" "}
										{new Date(githubStats.lastCommit).toLocaleDateString()}
									</p>
								)}
							</div>
						)}

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
												href={explorerAccountUrl(project.stellar_account_id, project.stellar_network)}
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
												href={explorerContractUrl(project.stellar_contract_id, project.stellar_network)}
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

						<div className="glass rounded-2xl p-8">
							<h2 className="font-semibold text-lg text-starlight mb-2">
								README badge
							</h2>
							<p className="text-sm text-ash mb-4">
								Add this to your README. The badge shows your current rating and links back here.
							</p>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={`/api/badge/${project.slug}.svg`}
								alt="Stellar Wave Hub rating badge"
								height={20}
								className="mb-4"
							/>
							<code className="block bg-stardust/30 rounded-xl px-4 py-3 text-xs font-mono text-moonlight break-all">
								{badgeSnippet}
							</code>
							<button
								type="button"
								onClick={copyBadge}
								className="btn-ghost text-sm !py-1.5 mt-3"
							>
								{badgeCopied ? "Copied!" : "Copy markdown"}
							</button>
						</div>
						
						{/* On-chain rating aggregate */}
						{onChainActive && onChainRating && onChainRating.count > 0 && (
							<div className="glass rounded-2xl p-8">
								<div className="flex items-center gap-2 mb-4">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
										<path d="M12 2L2 7l10 5 10-5-10-5z" />
										<path d="M2 17l10 5 10-5" />
										<path d="M2 12l10 5 10-5" />
									</svg>
									<h2 className="font-semibold text-lg text-starlight">On-Chain Rating</h2>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-plasma-bright">{onChainRating.average.toFixed(1)}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Average</p>
									</div>
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-nova-bright">{onChainRating.count}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Ratings</p>
									</div>
									<div className="bg-stardust/30 rounded-xl px-5 py-4 text-center">
										<p className="text-2xl font-bold text-aurora-bright">{onChainRating.sum}</p>
										<p className="text-xs text-ash mt-1 uppercase tracking-wider">Total Score</p>
									</div>
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
										{label: "Overall", value: averages.avg_score},
										{label: "Purpose", value: averages.avg_purpose},
										{label: "Innovation", value: averages.avg_innovation},
										{label: "Usability", value: averages.avg_usability},
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
													{Number(item.value || 0).toFixed(1)}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Embed snippet — shown at the bottom of the overview for project authors and visitors */}
						<EmbedSnippet slug={project.slug} />
					</div>
				)}

				{activeTab === "ratings" && (
					<div className="space-y-8">
						{/* Rating distribution histogram (5 -> 1 star) */}
						{ratings.length > 0 && (() => {
							const totalDistributionCount = Object.values(distribution).reduce((acc, c) => acc + c, 0);
							return (
								<div className="glass rounded-2xl p-8">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
										<div>
											<h2 className="font-semibold text-lg text-starlight">
												Rating Distribution
											</h2>
											<p className="text-xs text-ash mt-1">
												Breakdown of user ratings across all star levels
											</p>
										</div>
										{averages && (
											<div className="flex items-center gap-2">
												<svg
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="var(--solar)"
													stroke="none"
												>
													<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
												</svg>
												<span className="font-bold text-lg text-solar-bright">
													{Number(averages.avg_score || 0).toFixed(1)}
												</span>
												<span className="text-xs text-ash">
													({totalDistributionCount} rating{totalDistributionCount !== 1 ? "s" : ""})
												</span>
											</div>
										)}
									</div>

									<div className="space-y-3" role="region" aria-label="Rating distribution histogram">
										{[5, 4, 3, 2, 1].map((stars) => {
											const count = distribution[stars] || 0;
											const percentage = totalDistributionCount > 0 ? (count / totalDistributionCount) * 100 : 0;
											return (
												<div key={stars} className="flex items-center gap-3 text-sm">
													<div className="flex items-center gap-1 w-16 shrink-0 justify-end">
														<span className="font-medium text-starlight text-xs">{stars}</span>
														<svg
															width="12"
															height="12"
															viewBox="0 0 24 24"
															fill="var(--solar)"
															stroke="none"
														>
															<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
														</svg>
													</div>

													<div className="flex-1 h-3 bg-stardust/60 rounded-full overflow-hidden p-0.5">
														<div
															role="progressbar"
															aria-label={`${stars} star ratings: ${count} of ${totalDistributionCount} (${Math.round(percentage)}%)`}
															aria-valuenow={count}
															aria-valuemin={0}
															aria-valuemax={totalDistributionCount}
															className="h-full bg-gradient-to-r from-solar to-solar-bright rounded-full transition-all duration-500"
															style={{ width: `${percentage}%` }}
														/>
													</div>

													<div className="w-16 shrink-0 text-right">
														<span className="text-xs text-moonlight font-mono font-medium">
															{count}
														</span>
														<span className="text-[10px] text-ash ml-1 font-mono">
															({Math.round(percentage)}%)
														</span>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})()}
						{/* Already rated on-chain notice */}
						{onChainActive && alreadyRatedOnChain && user && user.id !== project.user_id && (
							<div className="glass rounded-2xl p-6 flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-plasma/10 border border-plasma/20 flex items-center justify-center shrink-0">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
										<path d="M12 2L2 7l10 5 10-5-10-5z" />
										<path d="M2 17l10 5 10-5" />
										<path d="M2 12l10 5 10-5" />
									</svg>
								</div>
								<div>
									<p className="text-sm font-medium text-starlight">Already rated on-chain</p>
									<p className="text-xs text-ash mt-0.5">
										Your rating for this project is permanently recorded on the Stellar blockchain.
									</p>
								</div>
							</div>
						)}

						{/* Submit rating form */}
						{canRate && (
							<form
								onSubmit={submitRating}
								className="glass rounded-2xl p-8 space-y-5"
							>
								<div>
									<h2 className="font-semibold text-lg text-starlight">
										Rate this project
									</h2>
									{onChainActive && (
										<p className="text-xs text-ash mt-1">
											Ratings are recorded on-chain. Each rating costs{" "}
											<span className="text-solar-bright font-semibold">{feeLabel}</span>{" "}
											and requires a linked Stellar wallet.
										</p>
									)}
								</div>
								{onChainActive && user && !user.stellar_address && (
									<div className="rounded-xl px-4 py-3 text-sm bg-solar/10 border border-solar/20 text-solar-bright">
										You need to{" "}
										<Link href="/profile" className="underline font-medium">
											link a Stellar wallet
										</Link>{" "}
										before rating.
									</div>
								)}
								{(ratingMsg || remainingSeconds > 0) && (
									<div
										role={remainingSeconds > 0 ? "status" : undefined}
										className={`rounded-xl px-4 py-3 text-sm ${remainingSeconds > 0 ? "bg-solar/10 border border-solar/20 text-solar-bright" : ratingMsg.includes("submitted") ? "bg-aurora/10 border border-aurora/20 text-aurora-bright" : "bg-supernova/10 border border-supernova/20 text-supernova"}`}
									>
										{remainingSeconds > 0
											? `Too many attempts. Try again in ${remainingSeconds}s.`
											: ratingMsg}
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
									onChange={(v) => setRatingForm((p) => ({...p, score: v}))}
								/>
								<StarRating
									label="Purpose"
									value={ratingForm.purpose_score}
									onChange={(v) => setRatingForm((p) => ({...p, purpose_score: v}))}
								/>
								<StarRating
									label="Innovation"
									value={ratingForm.innovation_score}
									onChange={(v) => setRatingForm((p) => ({...p, innovation_score: v}))}
								/>
								<StarRating
									label="Usability"
									value={ratingForm.usability_score}
									onChange={(v) => setRatingForm((p) => ({...p, usability_score: v}))}
								/>
								<div>
									<label
										htmlFor="review-text"
										className="block text-sm font-medium text-moonlight mb-2"
									>
										Review (optional)
									</label>
									<textarea
										id="review-text"
										rows={3}
										className="input-field resize-none"
										placeholder="Share your thoughts..."
										value={ratingForm.review_text}
										maxLength={MAX_REVIEW_TEXT_LENGTH}
										aria-describedby="review-text-counter"
										onChange={(e) =>
											setRatingForm((p) => ({...p, review_text: e.target.value}))
										}
									/>
									<p
										id="review-text-counter"
										className="mt-1 text-right text-xs text-ash"
										aria-live="polite"
									>
										{ratingForm.review_text.length}/{MAX_REVIEW_TEXT_LENGTH} characters
									</p>
								</div>
								<button
									type="submit"
									disabled={
										submitting ||
										remainingSeconds > 0 ||
										ratingForm.score === 0 ||
										(onChainActive && !user?.stellar_address)
									}
									className="btn-nova disabled:opacity-50"
								>
									{ratingStep === "onchain"
										? `Confirm in wallet (${feeLabel})...`
										: ratingStep === "saving"
											? "Saving..."
											: onChainActive
												? `Submit Rating (${feeLabel})`
												: "Submit Rating"}
								</button>
							</form>
						)}
						<AlertDialog open={showFeeConfirm} onOpenChange={setShowFeeConfirm}>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Confirm on-chain rating</AlertDialogTitle>
									<AlertDialogDescription>
										This on-chain rating costs {feeLabel} (+ network fee). Your wallet will ask you to sign the transaction next.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											setShowFeeConfirm(false);
											void performRating();
										}}
									>
										Pay {feeLabel} and rate
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						{/* Existing ratings */}
						{ratings.length > 1 && (
							<div className="flex justify-end mb-3">
								<label className="flex items-center gap-2 text-xs text-ash">
									Sort by:
									<select
										className="input-field !w-auto !py-1.5 text-xs"
										value={reviewSort}
										onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
									>
										{REVIEW_SORT_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
							</div>
						)}
						{ratings.length > 0 ? (
							<div className="space-y-4">
								{sortedRatings.map((rating) => (
									<div
										key={rating.id}
										id={`rating-${rating.id}`}
										className="glass rounded-2xl p-6"
									>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<Avatar
													username={rating.username}
													avatarUrl={rating.avatar_url}
													className="w-9 h-9 text-xs"
												/>
												<div>
													<span className="font-medium text-starlight text-sm">
														{rating.username}
													</span>
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
											<div className="text-sm text-moonlight/80 leading-relaxed">
												{renderReviewMarkdown(rating.review_text)}
											</div>
										)}
										<div className="flex gap-4 mt-3 text-xs text-ash flex-wrap items-center">
											{rating.purpose_score && (
												<span>Purpose: {rating.purpose_score}/5</span>
											)}
											{rating.innovation_score && (
												<span>Innovation: {rating.innovation_score}/5</span>
											)}
											{rating.usability_score && (
												<span>Usability: {rating.usability_score}/5</span>
											)}
											<VerifiedOnChainBadge txHash={rating.tx_hash} network={project.stellar_network} />
											{user && user.id !== rating.user_id ? (
												<button
													type="button"
													onClick={() => handleVoteHelpful(rating.id, !!rating.has_voted)}
													disabled={votingRatingId === rating.id}
													aria-pressed={!!rating.has_voted}
													className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
														rating.has_voted ? "text-aurora-bright" : "text-ash hover:text-moonlight"
													}`}
												>
													<svg width="12" height="12" viewBox="0 0 24 24" fill={rating.has_voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
														<path d="M7 10v12" />
														<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
													</svg>
													Helpful{rating.helpful_count ? ` (${rating.helpful_count})` : ""}
												</button>
											) : rating.helpful_count ? (
												<span>{rating.helpful_count} found this helpful</span>
											) : null}
											{user && user.id !== rating.user_id && (
												reportedIds.includes(rating.id) ? (
													<span className="ml-auto text-ash">Reported</span>
												) : (
													<button
														type="button"
														onClick={() => {
															setReportingId(reportingId === rating.id ? null : rating.id);
															setReportMsg("");
														}}
														className="ml-auto inline-flex items-center gap-1 text-ash hover:text-supernova transition-colors"
														aria-label={`Report review by ${rating.username}`}
													>
														<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
															<line x1="4" y1="22" x2="4" y2="15" />
														</svg>
														Report
													</button>
												)
											)}
										</div>
										{editingReplyRatingId === rating.id ? (
											<div className="mt-4 ml-6 space-y-2 border-l-2 border-nova/30 pl-4">
												<textarea
													className="input-field w-full text-sm"
													rows={3}
													maxLength={5000}
													value={replyDraft}
													onChange={(e) => setReplyDraft(e.target.value)}
													aria-label={`Reply to ${rating.username}'s review`}
													placeholder="Write a public reply as the project owner"
												/>
												{replyError && (
													<p role="alert" className="text-xs text-supernova">{replyError}</p>
												)}
												<div className="flex gap-2">
													<button
														type="button"
														onClick={() => handleSaveReply(rating.id)}
														disabled={replySubmitting || !replyDraft.trim()}
														className="btn-nova !py-1.5 text-xs disabled:opacity-50"
													>
														{replySubmitting ? "Saving..." : "Save reply"}
													</button>
													<button
														type="button"
														onClick={cancelReplyEdit}
														disabled={replySubmitting}
														className="btn-ghost !py-1.5 text-xs"
													>
														Cancel
													</button>
												</div>
											</div>
										) : rating.owner_reply ? (
											<div className="mt-4 ml-6 border-l-2 border-nova/30 pl-4">
												<div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
													<span className="tag tag-nova text-[10px]">Owner</span>
													{rating.owner_reply_at && (
														<span className="text-ash">
															{new Date(rating.owner_reply_at).toLocaleDateString()}
														</span>
													)}
													{isOwner && (
														<>
															<button
																type="button"
																onClick={() => startReplyEdit(rating.id, rating.owner_reply)}
																className="text-ash hover:text-moonlight"
															>
																Edit reply
															</button>
															<button
																type="button"
																onClick={() => handleDeleteReply(rating.id)}
																disabled={replySubmitting}
																className="text-ash hover:text-supernova disabled:opacity-50"
															>
																Delete
															</button>
														</>
													)}
												</div>
												<p className="whitespace-pre-line text-sm text-moonlight/80">{rating.owner_reply}</p>
											</div>
										) : isOwner ? (
											<button
												type="button"
												onClick={() => startReplyEdit(rating.id)}
												className="mt-3 text-xs text-nova-bright hover:underline"
											>
												Reply as owner
											</button>
										) : null}
										{reportingId === rating.id && (
											<form onSubmit={submitReport} className="mt-4 flex items-center gap-3 flex-wrap">
												<select
													className="input-field !w-auto"
													value={reportReason}
													onChange={(e) => setReportReason(e.target.value)}
													aria-label="Report reason"
												>
													<option value="spam">Spam</option>
													<option value="abusive">Abusive or offensive</option>
													<option value="off_topic">Off topic</option>
													<option value="misleading">Misleading</option>
													<option value="other">Other</option>
												</select>
												<button type="submit" disabled={reportBusy} className="btn-nova !py-1.5 text-sm disabled:opacity-50">
													{reportBusy ? "Sending..." : "Submit report"}
												</button>
												{reportMsg && <span className="text-xs text-supernova">{reportMsg}</span>}
											</form>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="glass rounded-2xl p-12 text-center">
								<p className="text-ash">
									No ratings yet. Be the first to rate this project!
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
									This project hasn&apos;t linked a Stellar account for on-chain tracking.
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
													<div>
														<span className="font-medium text-moonlight">
															{b.asset_code}
														</span>
														{b.asset_issuer && (
															<p className="text-xs text-ash font-mono mt-0.5">
																Issuer: {b.asset_issuer.slice(0, 8)}...{b.asset_issuer.slice(-4)}
															</p>
														)}
													</div>
													<span className="font-mono text-plasma-bright font-semibold">
														{Number(b.balance).toLocaleString()}
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
										href={explorerAccountUrl(project.stellar_account_id, project.stellar_network)}
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

			{/* Project Report Dialog */}
			<AlertDialog open={projectReportOpen} onOpenChange={setProjectReportOpen}>
				<AlertDialogContent className="max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--supernova)" strokeWidth="2">
								<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
								<line x1="4" y1="22" x2="4" y2="15" />
							</svg>
							Report &ldquo;{project.name}&rdquo;
						</AlertDialogTitle>
						<AlertDialogDescription>
							Flag this project if you notice spam, fraudulent activity, or inaccurate information. Reports are reviewed by our team.
						</AlertDialogDescription>
					</AlertDialogHeader>

					{!user ? (
						<div className="py-4 text-center space-y-4">
							<p className="text-sm text-ash">
								You must be signed in to report a project.
							</p>
							<Link
								href={`/login?redirect=/projects/${project.slug}`}
								className="btn-nova inline-flex"
								onClick={() => setProjectReportOpen(false)}
							>
								Sign in to report
							</Link>
						</div>
					) : hasReportedProject ? (
						<div className="py-4 text-center space-y-3">
							<div className="w-12 h-12 mx-auto rounded-full bg-supernova/15 border border-supernova/30 flex items-center justify-center text-supernova">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
							<p className="text-sm font-medium text-starlight">
								You already have an open report for this project
							</p>
							<p className="text-xs text-ash">
								Our team is reviewing your report. You can only have one open report per project at a time.
							</p>
							<div className="pt-2">
								<button
									type="button"
									onClick={() => setProjectReportOpen(false)}
									className="btn-ghost !py-2 !px-4 text-sm"
								>
									Close
								</button>
							</div>
						</div>
					) : projectReportSuccess ? (
						<div className="py-4 text-center space-y-3">
							<div className="w-12 h-12 mx-auto rounded-full bg-aurora/15 border border-aurora/30 flex items-center justify-center text-aurora-bright">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
							<p className="text-sm font-semibold text-aurora-bright">
								Report submitted successfully
							</p>
							<p className="text-xs text-ash">
								Thank you for helping maintain a safe and transparent ecosystem.
							</p>
						</div>
					) : (
						<form onSubmit={submitProjectReport} className="space-y-4">
							{projectReportMsg && (
								<div className="p-3 rounded-xl bg-supernova/10 border border-supernova/20 text-xs text-supernova">
									{projectReportMsg}
								</div>
							)}

							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-ash mb-2">
									Reason <span className="text-supernova">*</span>
								</label>
								<div className="grid grid-cols-2 gap-2">
									{PROJECT_REPORT_REASONS.map((r) => (
										<button
											key={r.value}
											type="button"
											onClick={() => setProjectReportReason(r.value)}
											className={`p-2.5 rounded-xl text-left border transition-all ${
												projectReportReason === r.value
													? "bg-supernova/15 border-supernova text-starlight shadow-sm"
													: "bg-nebula/60 border-dust/30 text-ash hover:text-moonlight hover:border-dust/60"
											}`}
										>
											<div className="text-xs font-medium text-starlight">{r.label}</div>
											<div className="text-[11px] text-ash/80 mt-0.5 leading-tight">{r.description}</div>
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-ash mb-1.5">
									Note <span className="text-ash/60 font-normal lowercase">(optional details)</span>
								</label>
								<Textarea
									value={projectReportNote}
									onChange={(e) => setProjectReportNote(e.target.value)}
									placeholder="Describe the issue, provide links or details to assist moderation..."
									rows={3}
									maxLength={1000}
									className="text-xs"
								/>
								<div className="text-[10px] text-ash/60 text-right mt-1">
									{projectReportNote.length}/1000
								</div>
							</div>

							<AlertDialogFooter>
								<AlertDialogCancel
									type="button"
									onClick={() => {
										setProjectReportOpen(false);
										setProjectReportMsg("");
									}}
									disabled={projectReportBusy}
								>
									Cancel
								</AlertDialogCancel>
								<button
									type="submit"
									disabled={projectReportBusy}
									className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all bg-supernova text-void hover:bg-supernova/90 disabled:opacity-50"
								>
									{projectReportBusy ? "Submitting..." : "Submit report"}
								</button>
							</AlertDialogFooter>
						</form>
					)}
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
