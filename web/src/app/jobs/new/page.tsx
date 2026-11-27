"use client";

import {useEffect, useMemo, useState, type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import {buildMemo} from "@/lib/pricing";
import {JOB_TYPE_LABELS, JOB_TYPES, type JobType} from "@/lib/jobs";
import {payWithFreighter} from "@/lib/payments-client";

interface Project {
	id: number;
	name: string;
	slug: string;
	status: string;
}

interface PaymentConfig {
	priceXlm: number;
	destination: string | null;
	network: "mainnet" | "testnet";
	horizonUrl: string;
}

interface JobForm {
	project_id: number | "";
	title: string;
	description: string;
	type: JobType;
	compensation: string;
	compensation_currency: "USD" | "XLM";
	compensation_period: "hour" | "month" | "year" | "fixed";
	location: string;
	remote: boolean;
	apply_url: string;
}

const initialForm: JobForm = {
	project_id: "",
	title: "",
	description: "",
	type: "full_time",
	compensation: "",
	compensation_currency: "USD",
	compensation_period: "year",
	location: "",
	remote: true,
	apply_url: "",
};

const inputClass = "w-full rounded-xl border border-dust/30 bg-space/80 px-3.5 py-3 text-sm text-starlight placeholder:text-ash/60 focus:border-nova/60 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-moonlight";

export default function NewJobPage() {
	const {user, token, loading: authLoading} = useAuth();
	const router = useRouter();
	const [projects, setProjects] = useState<Project[]>([]);
	const [loadingPage, setLoadingPage] = useState(true);
	const [form, setForm] = useState<JobForm>(initialForm);
	const [featured, setFeatured] = useState(false);
	const [config, setConfig] = useState<PaymentConfig | null>(null);
	const [pageError, setPageError] = useState("");
	const [busy, setBusy] = useState(false);
	const [pendingJobId, setPendingJobId] = useState<number | null>(null);
	const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
	const [message, setMessage] = useState("");

	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		Promise.all([
			fetch("/api/projects/my", {headers: {Authorization: `Bearer ${token}`}}),
			fetch("/api/featured/config"),
			fetch("/api/pricing"),
		])
			.then(async ([projectsResponse, paymentResponse, pricingResponse]) => {
				if (!projectsResponse.ok || !paymentResponse.ok || !pricingResponse.ok) {
					throw new Error("Could not load projects or payment configuration.");
				}
				const [projectsData, paymentData, pricingData] = await Promise.all([
					projectsResponse.json(),
					paymentResponse.json(),
					pricingResponse.json(),
				]);
				const approvedProjects = (projectsData.projects ?? []).filter(
					(project: Project) => project.status === "approved" || project.status === "featured",
				) as Project[];
				const priceXlm = Number(pricingData.products?.job_post?.priceXlm);
				if (!Number.isFinite(priceXlm) || priceXlm <= 0) {
					throw new Error("Job posting price is not configured correctly.");
				}
				if (!cancelled) {
					setProjects(approvedProjects);
					setForm((current) => ({
						...current,
						project_id: approvedProjects[0]?.id ?? "",
					}));
					setConfig({
						priceXlm,
						destination: paymentData.destination,
						network: paymentData.network === "mainnet" ? "mainnet" : "testnet",
						horizonUrl: paymentData.horizonUrl,
					});
				}
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					setPageError(error instanceof Error ? error.message : "Could not load job posting.");
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingPage(false);
			});
		return () => {
			cancelled = true;
		};
	}, [token]);

	const selectedProject = useMemo(
		() => projects.find((project) => project.id === form.project_id),
		[form.project_id, projects],
	);

	function update<K extends keyof JobForm>(field: K, value: JobForm[K]) {
		setForm((current) => ({...current, [field]: value}));
	}

	async function activateJob(jobId: number, txHash: string) {
		if (!token) throw new Error("Sign in to activate this job.");
		const response = await fetch(`/api/jobs/${jobId}/activate`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({tx_hash: txHash, featured}),
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || "Could not activate job.");
		router.push(`/jobs/${jobId}`);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!token || !config?.destination) {
			setPageError("Job payments are not configured.");
			return;
		}
		if (form.project_id === "") {
			setPageError("Choose an approved project.");
			return;
		}

		setBusy(true);
		setPageError("");
		setMessage("");
		try {
			if (pendingJobId && pendingTxHash) {
				await activateJob(pendingJobId, pendingTxHash);
				return;
			}

			const createResponse = await fetch("/api/jobs", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					project_id: form.project_id,
					title: form.title,
					description: form.description,
					type: form.type,
					compensation: form.compensation ? Number(form.compensation) : null,
					compensation_currency: form.compensation_currency,
					compensation_period: form.compensation_period,
					location: form.location.trim() || null,
					remote: form.remote,
					apply_url: form.apply_url,
				}),
			});
			const created = await createResponse.json();
			if (!createResponse.ok) throw new Error(created.error || "Could not save job draft.");

			const jobId = Number(created.job.id);
			setPendingJobId(jobId);
			setMessage("Draft saved. Confirm the payment in Freighter to publish.");

			const txHash = await payWithFreighter({
				amountXlm: config.priceXlm,
				destination: config.destination,
				network: config.network,
				horizonUrl: config.horizonUrl,
				memo: buildMemo("job_post", jobId),
			});
			setPendingTxHash(txHash);
			await activateJob(jobId, txHash);
		} catch (error) {
			setPageError(error instanceof Error ? error.message : "Could not post this job.");
		} finally {
			setBusy(false);
		}
	}

	if (authLoading || (token && loadingPage)) {
		return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ash">Loading...</div>;
	}

	if (!user || !token) {
		return (
			<div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
				<h1 className="font-display text-2xl font-bold text-starlight">Sign in to post a job</h1>
				<Link href="/login" className="btn-primary mt-5">Sign in</Link>
			</div>
		);
	}

	return (
		<main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="mb-8">
				<Link href="/jobs" className="text-sm text-ash hover:text-nova-bright">← All jobs</Link>
				<p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-nova-bright">Stellar Wave / Hiring</p>
				<h1 className="font-display text-4xl font-black tracking-tight text-starlight">Post a role<span className="text-nova-bright">.</span></h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-moonlight/75">
					Publish your project&apos;s next opportunity. Your listing goes live for 30 days after payment is verified.
				</p>
			</div>

			{pageError && (
				<p role="alert" className="mb-5 rounded-xl border border-supernova/30 bg-supernova/10 p-4 text-sm text-supernova">
					{pageError}
				</p>
			)}
			{message && (
				<p role="status" className="mb-5 rounded-xl border border-nova/30 bg-nova/10 p-4 text-sm text-nova-bright">
					{message}
				</p>
			)}

			{projects.length === 0 && !pageError ? (
				<section className="glass rounded-2xl p-8 text-center">
					<h2 className="font-display text-xl font-bold text-starlight">An approved project is required</h2>
					<p className="mt-2 text-sm text-ash">Submit a project and wait for approval before posting a job.</p>
					<Link href="/my-projects" className="btn-primary mt-5 inline-flex">My projects</Link>
				</section>
			) : (
				<form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
					<div className="glass space-y-5 rounded-2xl p-5 sm:p-7">
						<label className="block">
							<span className={labelClass}>Hiring for project</span>
							<select
								required
								value={form.project_id}
								onChange={(event) => update("project_id", Number(event.target.value))}
								className={inputClass}
							>
								{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
							</select>
						</label>

						<label className="block">
							<span className={labelClass}>Job title</span>
							<input required minLength={3} maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Senior Soroban Engineer" className={inputClass} />
						</label>

						<label className="block">
							<span className={labelClass}>Description</span>
							<textarea required minLength={20} maxLength={10000} rows={8} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe the role, responsibilities, and what the team is building..." className={`${inputClass} resize-y`} />
						</label>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className={labelClass}>Role type</span>
								<select value={form.type} onChange={(event) => update("type", event.target.value as JobType)} className={inputClass}>
									{JOB_TYPES.map((type) => <option key={type} value={type}>{JOB_TYPE_LABELS[type]}</option>)}
								</select>
							</label>
							<label className="block">
								<span className={labelClass}>Location</span>
								<input maxLength={120} value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="City, country or timezone" className={inputClass} />
							</label>
						</div>

						<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_9rem]">
							<label className="block">
								<span className={labelClass}>Compensation (optional)</span>
								<input type="number" min="0" step="any" value={form.compensation} onChange={(event) => update("compensation", event.target.value)} placeholder="Not specified" className={inputClass} />
							</label>
							<label className="block">
								<span className={labelClass}>Currency</span>
								<select value={form.compensation_currency} onChange={(event) => update("compensation_currency", event.target.value as JobForm["compensation_currency"])} className={inputClass}>
									<option value="USD">USD</option><option value="XLM">XLM</option>
								</select>
							</label>
							<label className="block">
								<span className={labelClass}>Per</span>
								<select value={form.compensation_period} onChange={(event) => update("compensation_period", event.target.value as JobForm["compensation_period"])} className={inputClass}>
									<option value="hour">Hour</option><option value="month">Month</option><option value="year">Year</option><option value="fixed">Fixed</option>
								</select>
							</label>
						</div>

						<label className="block">
							<span className={labelClass}>Application URL</span>
							<input required type="url" value={form.apply_url} onChange={(event) => update("apply_url", event.target.value)} placeholder="https://..." className={inputClass} />
						</label>

						<label className="flex items-center gap-3 rounded-xl border border-dust/20 bg-space/60 p-4">
							<input type="checkbox" checked={form.remote} onChange={(event) => update("remote", event.target.checked)} className="h-4 w-4 accent-cyan-400" />
							<span className="text-sm text-moonlight">This role is remote-friendly</span>
						</label>
					</div>

					<aside className="space-y-4">
						<section className="glass rounded-2xl p-5">
							<p className="text-xs font-bold uppercase tracking-[0.16em] text-ash">Checkout</p>
							<div className="mt-4 flex items-baseline justify-between">
								<span className="text-sm text-moonlight">30-day listing</span>
								<span className="font-display text-2xl font-bold text-starlight">{config?.priceXlm ?? "—"} XLM</span>
							</div>
							<p className="mt-2 text-xs leading-5 text-ash">Your job stays as a draft until the exact payment and memo are verified.</p>
							<label className="mt-5 flex items-start gap-3 rounded-xl border border-solar/25 bg-solar/5 p-3.5">
								<input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-400" />
								<span>
									<span className="block text-sm font-semibold text-solar-bright">Feature this job</span>
									<span className="mt-1 block text-xs leading-5 text-ash">Pin it above other roles for the same 30-day period. Included with the posting.</span>
								</span>
							</label>
							{!config?.destination && (
								<p className="mt-4 text-xs text-supernova">Job payment is not configured. Please try again later.</p>
							)}
							<button
								type="submit"
								disabled={busy || !config?.destination || projects.length === 0}
								className="btn-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
							>
								{busy
									? "Confirming payment..."
									: pendingJobId && pendingTxHash
										? "Retry payment verification"
										: `Pay ${config?.priceXlm ?? "—"} XLM & publish`}
							</button>
							<p className="mt-3 text-center text-[11px] leading-5 text-ash">Memo: job:&lt;jobId&gt; · Stellar {config?.network ?? "network"}</p>
						</section>
						<p className="px-2 text-xs leading-5 text-ash">
							{selectedProject
								? `Posting for ${selectedProject.name}. The listing will appear publicly once payment confirmation succeeds.`
								: "Choose an approved project to continue."}
						</p>
					</aside>
				</form>
			)}
		</main>
	);
}
