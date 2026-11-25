"use client";

import {useEffect, useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {FeatureButton} from "@/components/FeatureButton";
import {PayFallback} from "@/components/PayFallback";
import {ProButton} from "@/components/ProButton";
import ProBadge from "@/components/ProBadge";
import {payWithFreighter} from "@/lib/payments-client";
import {
	FREE_RESEARCH_IMAGE_LIMIT,
	PRO_RESEARCH_IMAGE_LIMIT,
	isPro,
} from "@/lib/pro";
import Link from "next/link";

interface Project {
	id: number;
	name: string;
	slug: string;
	description: string;
	category: string;
	status: string;
	featured: number;
	featured_expires_at?: string | null;
	is_pro?: boolean | number | null;
	pro_until?: string | null;
	plan?: string | null;
	avg_rating?: number;
	rating_count?: number;
	created_at: string;
	rejection_reason?: string;
	priority_until?: string | null;
}

interface ProConfig {
	priceXlm: number;
	durationDays: number;
	destination: string | null;
	network: "mainnet" | "testnet";
	horizonUrl: string;
}

const DEFAULT_PRO_PRICE_XLM =
	Number(process.env.NEXT_PUBLIC_PRO_PRICE_XLM) > 0
		? Number(process.env.NEXT_PUBLIC_PRO_PRICE_XLM)
		: 25;
const DEFAULT_PRO_DURATION_DAYS = 30;

const PRO_BENEFITS = [
	"Pro badge displayed on project cards and detail pages",
	`Upload up to ${PRO_RESEARCH_IMAGE_LIMIT} research images per project (up from ${FREE_RESEARCH_IMAGE_LIMIT})`,
	"Stand out across Stellar Wave Hub discovery",
];

const statusStyles: Record<string, string> = {
	submitted: "tag-solar",
	approved: "tag-aurora",
	featured: "tag-aurora",
	rejected: "tag-supernova",
};

function isPriorityActive(priorityUntil?: string | null): boolean {
	if (!priorityUntil) return false;
	return new Date(priorityUntil) > new Date();
}

/** Days purchased per spotlight activation (server default: 30). */
const SPOTLIGHT_DAYS = 30;

/**
 * A spotlight is active while the project is featured and its expiry is
 * still in the future — this decides between the "Extend" and "Feature"
 * labels (issue #453).
 */
function isSpotlightActive(project: Project): boolean {
	return (
		project.featured === 1 &&
		!!project.featured_expires_at &&
		new Date(project.featured_expires_at).getTime() > Date.now()
// Spotlight renewal nudge: prompt a repeat purchase once the spotlight is close to ending.
const RENEWAL_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function getSpotlightDaysLeft(featuredExpiresAt?: string | null): number | null {
	if (!featuredExpiresAt) return null;

	const expiresAt = new Date(featuredExpiresAt).getTime();
	if (Number.isNaN(expiresAt)) return null;

	const remainingMs = expiresAt - Date.now();
	if (remainingMs <= 0) return null;

	const daysLeft = Math.ceil(remainingMs / DAY_MS);
	return daysLeft <= RENEWAL_WINDOW_DAYS ? daysLeft : null;
}

function SpotlightRenewalBanner({
	expiresAt,
	slug,
}: {
	expiresAt?: string | null;
	slug: string;
}) {
	const daysLeft = getSpotlightDaysLeft(expiresAt);
	if (daysLeft === null) return null;

	return (
		<div
			role="status"
			className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-solar/25 bg-solar/10 px-4 py-3"
		>
			<p className="text-sm text-solar-bright">
				Spotlight expires in {daysLeft} {daysLeft === 1 ? "day" : "days"} —
				renew to stay on the home page.
			</p>
			<Link
				href={`/projects/${slug}`}
				className="btn-nova text-sm !py-1.5 !px-3 inline-flex shrink-0 self-start sm:self-auto"
			>
				Renew
			</Link>
		</div>
	);
}

function UpgradeToProCard({
	projects,
	token,
	onUpgraded,
}: {
	projects: Project[];
	token: string | null;
	onUpgraded: (projectId: number, proUntil?: string | null) => void;
}) {
	const eligibleProjects = projects.filter((p) => !isPro(p));
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
		() => eligibleProjects[0]?.id ?? null,
	);
	const [config, setConfig] = useState<ProConfig | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	const activeProjectId =
		eligibleProjects.some((p) => p.id === selectedProjectId)
			? selectedProjectId
			: (eligibleProjects[0]?.id ?? null);

	useEffect(() => {
		let cancelled = false;
		async function loadConfig() {
			try {
				const res = await fetch("/api/pro/config");
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) {
						setConfig({
							priceXlm: Number(data.priceXlm ?? data.price_xlm) || DEFAULT_PRO_PRICE_XLM,
							durationDays: Number(data.durationDays ?? data.duration_days) || DEFAULT_PRO_DURATION_DAYS,
							destination: data.destination ?? null,
							network: data.network === "mainnet" ? "mainnet" : "testnet",
							horizonUrl:
								data.horizonUrl ||
								(data.network === "mainnet"
									? "https://horizon.stellar.org"
									: "https://horizon-testnet.stellar.org"),
						});
					}
					return;
				}
			} catch {
				// Fall through to shared payment config.
			}

			try {
				const fallbackRes = await fetch("/api/featured/config");
				if (!fallbackRes.ok) throw new Error("Could not load Pro payment configuration.");
				const fallbackData = await fallbackRes.json();
				if (!cancelled) {
					setConfig({
						priceXlm: DEFAULT_PRO_PRICE_XLM,
						durationDays: DEFAULT_PRO_DURATION_DAYS,
						destination: fallbackData.destination ?? null,
						network: fallbackData.network === "mainnet" ? "mainnet" : "testnet",
						horizonUrl:
							fallbackData.horizonUrl ||
							(fallbackData.network === "mainnet"
								? "https://horizon.stellar.org"
								: "https://horizon-testnet.stellar.org"),
					});
				}
			} catch (reason: unknown) {
				if (!cancelled) {
					setError(
						reason instanceof Error
							? reason.message
							: "Could not load Pro payment configuration.",
					);
				}
			}
		}

		loadConfig();
		return () => {
			cancelled = true;
		};
	}, []);

	if (eligibleProjects.length === 0) return null;

	async function verifyAndActivatePro(txHash: string) {
		if (!token || !activeProjectId) return;

		setBusy(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch("/api/pro/activate", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					project_id: activeProjectId,
					tx_hash: txHash,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data.error || "Payment was sent but Pro could not be activated.",
				);
			}
			const proUntil = data.pro_until ?? data.expires_at ?? null;
			onUpgraded(activeProjectId, proUntil);
			setMessage("Pro activated! Your project badge is now live.");
		} catch (reason: unknown) {
			setError(
				`${reason instanceof Error ? reason.message : "Pro activation failed."} Payment transaction: ${txHash}.`,
			);
		} finally {
			setBusy(false);
		}
	}

	async function handlePay() {
		if (!token || !config || !activeProjectId) return;
		if (!config.destination) {
			setError("Pro payments are not configured yet.");
			return;
		}

		setBusy(true);
		setError("");
		setMessage("");

		let txHash: string;
		try {
			txHash = await payWithFreighter({
				amountXlm: config.priceXlm,
				destination: config.destination,
				network: config.network,
				horizonUrl: config.horizonUrl,
				memo: "pro",
			});
		} catch (reason: unknown) {
			setError(
				reason instanceof Error
					? reason.message
					: "Could not send Pro payment.",
			);
			setBusy(false);
			return;
		}

		await verifyAndActivatePro(txHash);
	}

	const priceLabel = config
		? `${config.priceXlm} XLM / ${config.durationDays} days`
		: `${DEFAULT_PRO_PRICE_XLM} XLM / ${DEFAULT_PRO_DURATION_DAYS} days`;

	return (
		<section
			aria-labelledby="upgrade-to-pro-heading"
			className="glass rounded-2xl border border-plasma/30 bg-gradient-to-br from-plasma/10 via-space/80 to-nova/10 p-6 mb-8 animate-in"
		>
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2.5 mb-2">
						<span className="inline-flex items-center gap-1 rounded-full border border-plasma/40 bg-plasma/20 px-2.5 py-0.5 text-xs font-bold tracking-wide text-plasma-bright">
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
							</svg>
							Pro
						</span>
						<span className="text-xs font-medium text-plasma-bright">
							{priceLabel}
						</span>
					</div>
					<h2
						id="upgrade-to-pro-heading"
						className="font-display font-bold text-xl text-starlight mb-1"
					>
						Upgrade to Pro
					</h2>
					<p className="text-sm text-ash mb-4">
						Unlock Pro features and a verified Pro badge for your project.
					</p>
					<ul className="space-y-2 text-sm text-moonlight">
						{PRO_BENEFITS.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2.5">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--aurora-bright)"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="mt-0.5 shrink-0"
									aria-hidden="true"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>

				<div className="w-full lg:w-80 shrink-0 rounded-xl border border-dust/25 bg-space/80 p-4">
					{eligibleProjects.length > 1 ? (
						<div className="mb-3">
							<label
								htmlFor="pro-project-select"
								className="block text-xs font-medium text-ash mb-1.5"
							>
								Project to upgrade
							</label>
							<select
								id="pro-project-select"
								value={activeProjectId ?? ""}
								onChange={(e) => setSelectedProjectId(Number(e.target.value))}
								disabled={busy}
								className="w-full rounded-lg border border-dust/30 bg-void/80 px-3 py-2 text-sm text-starlight focus:border-plasma/60 focus:outline-none disabled:opacity-50"
							>
								{eligibleProjects.map((project) => (
									<option key={project.id} value={project.id}>
										{project.name}
									</option>
								))}
							</select>
						</div>
					) : (
						<p className="text-xs text-ash mb-3">
							Upgrading{" "}
							<span className="font-medium text-starlight">
								{eligibleProjects[0].name}
							</span>
						</p>
					)}

					{config && !config.destination && (
						<p className="mb-3 text-xs text-supernova">
							Pro payments are not configured yet.
						</p>
					)}
					{error && (
						<p role="alert" className="mb-3 break-words text-xs text-supernova">
							{error}
						</p>
					)}
					{message && (
						<p role="status" className="mb-3 text-xs text-aurora-bright">
							{message}
						</p>
					)}

					<button
						type="button"
						onClick={handlePay}
						disabled={busy || !config?.destination || !token || !activeProjectId}
						className="btn-nova w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
					>
						{busy
							? "Confirming payment..."
							: config
								? `Pay ${config.priceXlm} XLM`
								: "Loading price..."}
					</button>

					{config?.destination && (
						<PayFallback
							destination={config.destination}
							amountXlm={config.priceXlm}
							memo="pro"
							disabled={busy || !token || !activeProjectId}
							onVerifyTxHash={verifyAndActivatePro}
						/>
					)}
				</div>
			</div>
		</section>
	);
}

export default function MyProjectsPage() {
	const {user, token} = useAuth();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [activatingId, setActivatingId] = useState<number | null>(null);
	const [spotlightReceipt, setSpotlightReceipt] = useState<Record<number, string>>({});
	const [spotlightErrors, setSpotlightErrors] = useState<Record<number, string>>({});
	const [fastTrackingId, setFastTrackingId] = useState<number | null>(null);
	const [fastTrackError, setFastTrackError] = useState<string | null>(null);
	const [fastTrackSuccess, setFastTrackSuccess] = useState<number | null>(null);

	useEffect(() => {
		if (!token) return;
		const timer = window.setTimeout(() => {
			fetch("/api/projects/my", {
				headers: {Authorization: `Bearer ${token}`},
			})
				.then((r) => r.json())
				.then((data) => setProjects(data.projects || []))
				.catch(() => {})
				.finally(() => setLoading(false));
		}, 0);
		return () => window.clearTimeout(timer);
	}, [token]);

	async function handleFastTrack(projectId: number) {
		if (!token) return;
		setFastTrackingId(projectId);
		setFastTrackError(null);
		setFastTrackSuccess(null);
		try {
			const res = await fetch(`/api/projects/${projectId}/priority`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({duration_days: 7}),
			});
			const data = await res.json();
			if (!res.ok) {
				setFastTrackError(data.error || "Failed to fast-track project");
			} else {
				setFastTrackSuccess(projectId);
				// Update local state so the button reflects the new priority
				setProjects((prev) =>
					prev.map((p) =>
						p.id === projectId
							? {...p, priority_until: data.priority_until}
							: p,
					),
				);
			}
		} catch {
			setFastTrackError("An unexpected error occurred");
		} finally {
			setFastTrackingId(null);
		}
	}

	/**
	 * Activate (or extend) the project's featured spotlight. The server adds
	 * the purchased days to the current expiry while the spotlight is active,
	 * and responds with the new expiry, which we show as a receipt (issue #453).
	 */
	const handleSpotlight = async (project: Project) => {
		setActivatingId(project.id);
		setSpotlightErrors((prev) => ({...prev, [project.id]: ""}));
		try {
			const res = await fetch("/api/featured/activate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					project_id: project.id,
					duration_days: SPOTLIGHT_DAYS,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Spotlight activation failed");
			}
			const expiresAt = String(data.expires_at);
			setSpotlightReceipt((prev) => ({...prev, [project.id]: expiresAt}));
			setProjects((prev) =>
				prev.map((p) =>
					p.id === project.id
						? {
								...p,
								featured: 1,
								status: "featured",
								featured_expires_at: expiresAt,
						  }
						: p,
				),
			);
		} catch (err) {
			setSpotlightErrors((prev) => ({
				...prev,
				[project.id]:
					err instanceof Error ? err.message : "Spotlight activation failed",
			}));
		} finally {
			setActivatingId(null);
		}
	};

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

			{fastTrackError && (
				<div className="mb-4 glass rounded-xl p-4 border border-supernova/30 text-supernova text-sm animate-in">
					{fastTrackError}
				</div>
			)}

			{loading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="skeleton h-28 rounded-2xl" />
					))}
				</div>
			) : projects.length > 0 ? (
				<>
				<UpgradeToProCard
					projects={projects}
					token={token}
					onUpgraded={(projectId, proUntil) =>
						setProjects((current) =>
							current.map((item) =>
								item.id === projectId
									? {
											...item,
											is_pro: true,
											plan: "pro",
											pro_until: proUntil ?? item.pro_until,
										}
									: item,
							),
						)
					}
				/>
				<div className="space-y-4 animate-in animate-in-delay-1">
					{projects.map((project) => (
						<div
							key={project.id}
							className={`glass glass-hover rounded-2xl p-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 ${
								isPriorityActive(project.priority_until) ? "border-l-2 border-l-nova/60" : ""
							}`}
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
											{project.featured_expires_at &&
												` until ${new Date(
													project.featured_expires_at,
												).toLocaleDateString()}`}
										</span>
									)}
									<ProBadge project={project} size="sm" />
									{isPriorityActive(project.priority_until) && (
										<span className="tag text-xs inline-flex items-center gap-1 bg-nova/15 text-nova-bright border border-nova/30 font-semibold">
											<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
												<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
											</svg>
											Priority
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
								{(project.status === "approved" ||
									isSpotlightActive(project)) && (
									<button
										type="button"
										onClick={() => handleSpotlight(project)}
										disabled={activatingId === project.id}
										className="btn-nova text-sm !py-1.5 !px-3"
									>
										{activatingId === project.id
											? "Processing..."
											: isSpotlightActive(project)
												? "Extend"
												: "Feature"}
									</button>
								)}
								{project.status === "submitted" && !isPriorityActive(project.priority_until) && (
									<button
										onClick={() => handleFastTrack(project.id)}
										disabled={fastTrackingId === project.id}
										className="btn-ghost text-sm !py-1.5 !px-3 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-nova-bright border-nova/30 hover:border-nova/60"
									>
										<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
											<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
										</svg>
										{fastTrackingId === project.id
											? "Processing…"
											: fastTrackSuccess === project.id
												? "Fast-tracked!"
												: "Fast-track review"}
									</button>
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
								<FeatureButton
									projectId={project.id}
									onActivated={(expiresAt) =>
										setProjects((current) =>
											current.map((item) =>
												item.id === project.id
													? {
															...item,
															featured: 1,
															status: "featured",
															featured_expires_at: expiresAt,
														}
													: item,
											),
										)
									}
								/>
								<ProButton
									projectId={project.id}
									proUntil={project.pro_until}
									onActivated={(proUntil) =>
										setProjects((current) =>
											current.map((item) =>
												item.id === project.id
													? { ...item, pro_until: proUntil }
													: item,
											),
										)
									}
								/>
							</div>
							{spotlightErrors[project.id] && (
								<p className="text-sm text-supernova sm:basis-full">
									{spotlightErrors[project.id]}
								</p>
							)}
							{spotlightReceipt[project.id] && (
								<p className="text-xs text-solar-bright sm:basis-full">
									Spotlight confirmed — new expiry:{" "}
									{new Date(
										spotlightReceipt[project.id],
									).toLocaleString()}
								</p>
							)}
							<SpotlightRenewalBanner
								expiresAt={project.featured_expires_at}
								slug={project.slug}
							/>
						</div>
					))}
				</div>
				</>
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
