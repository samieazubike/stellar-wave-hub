"use client";

import {useCallback, useEffect, useState, type FormEvent} from "react";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

interface ApiKey {
	id: string;
	name: string;
	prefix: string;
	tier: string;
	created_at: string;
	last_used_at: string | null;
	revoked_at: string | null;
}

interface ApiProduct {
	priceXlm: number;
	durationDays: number | null;
}

function formatDate(value: string | null) {
	if (!value) return "Never";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Unknown"
		: date.toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
}

function CodeBlock({children}: {children: string}) {
	return (
		<pre className="overflow-x-auto rounded-xl border border-dust/20 bg-[#090d14] p-4 text-xs leading-6 text-cyan-100">
			<code>{children}</code>
		</pre>
	);
}

export default function DevelopersPage() {
	const {user, token, loading: authLoading} = useAuth();
	const [keys, setKeys] = useState<ApiKey[]>([]);
	const [loadedToken, setLoadedToken] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [newKey, setNewKey] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [copyMessage, setCopyMessage] = useState("");
	const [apiPro, setApiPro] = useState<ApiProduct | null>(null);

	const loadKeys = useCallback(async () => {
		if (!token) return;
		const response = await fetch("/api/keys", {
			headers: {Authorization: `Bearer ${token}`},
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || "Could not load API keys.");
		setKeys(data.keys ?? []);
	}, [token]);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		Promise.all([
			fetch("/api/keys", {headers: {Authorization: `Bearer ${token}`}}),
			fetch("/api/pricing"),
		])
			.then(async ([keysResponse, pricingResponse]) => {
				const keysData = await keysResponse.json();
				if (!keysResponse.ok) throw new Error(keysData.error || "Could not load API keys.");
				if (!pricingResponse.ok) throw new Error("Could not load API Pro pricing.");
				const pricingData = await pricingResponse.json();
				if (!cancelled) {
					setKeys(keysData.keys ?? []);
					setApiPro(pricingData.products?.api_pro ?? null);
					setLoadedToken(token);
				}
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setError(reason instanceof Error ? reason.message : "Could not load developer settings.");
					setLoadedToken(token);
				}
			})
		return () => {
			cancelled = true;
		};
	}, [token]);

	async function createKey(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!token) return;
		setBusy(true);
		setError("");
		setNotice("");
		setNewKey("");
		try {
			const response = await fetch("/api/keys", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({name}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Could not create API key.");
			setNewKey(data.key);
			setName("");
			setNotice("Key created. Copy it now; the full secret is only shown once.");
			await loadKeys();
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not create API key.");
		} finally {
			setBusy(false);
		}
	}

	async function revokeKey(key: ApiKey) {
		if (!token || !window.confirm(`Revoke "${key.name}"? Applications using it will stop authenticating.`)) {
			return;
		}
		setBusy(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch(`/api/keys?id=${encodeURIComponent(key.id)}`, {
				method: "DELETE",
				headers: {Authorization: `Bearer ${token}`},
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Could not revoke API key.");
			}
			setKeys((current) => current.map((item) =>
				item.id === key.id ? {...item, revoked_at: new Date().toISOString()} : item,
			));
			setNotice(`"${key.name}" has been revoked.`);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not revoke API key.");
		} finally {
			setBusy(false);
		}
	}

	async function copyText(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopyMessage(`${label} copied`);
		} catch (reason) {
			console.error("Unable to copy developer portal text:", reason);
			setCopyMessage("Copy failed — select and copy the text manually.");
		}
	}

	if (authLoading || (token && loadedToken !== token)) {
		return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-ash">Loading developer portal...</div>;
	}

	if (!user || !token) {
		return (
			<main className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-4 text-center">
				<p className="text-xs font-bold uppercase tracking-[0.2em] text-nova-bright">Developer portal</p>
				<h1 className="mt-3 font-display text-3xl font-bold text-starlight">Your API workspace awaits</h1>
				<p className="mt-3 text-sm leading-6 text-ash">Sign in to create and manage API keys.</p>
				<Link href="/login" className="btn-primary mt-6">Sign in</Link>
			</main>
		);
	}

	return (
		<main className="relative min-h-screen overflow-hidden">
			<div className="pointer-events-none absolute -right-36 -top-32 h-[28rem] w-[28rem] rounded-full border border-nova/10" />
			<div className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full border border-plasma/10" />
			<div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
				<header className="mb-10 max-w-3xl">
					<p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-nova-bright">
						<span className="h-px w-8 bg-nova-bright" /> Stellar Wave / Developers
					</p>
					<h1 className="font-display text-4xl font-black tracking-tight text-starlight sm:text-5xl">
						Build with the <span className="text-nova-bright">ecosystem.</span>
					</h1>
					<p className="mt-4 max-w-2xl text-base leading-7 text-moonlight/75">
						Create a key, make your first authenticated request, and bring public Stellar Wave data into your product.
					</p>
				</header>

				{error && <p role="alert" className="mb-5 rounded-xl border border-supernova/30 bg-supernova/10 p-4 text-sm text-supernova">{error}</p>}
				{notice && <p role="status" className="mb-5 rounded-xl border border-nova/30 bg-nova/10 p-4 text-sm text-nova-bright">{notice}</p>}
				{copyMessage && <p aria-live="polite" className="mb-5 text-xs text-ash">{copyMessage}</p>}

				{newKey && (
					<section className="mb-7 rounded-2xl border border-solar/35 bg-solar/10 p-5 sm:p-6">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="font-display text-lg font-bold text-solar-bright">Save your secret key</h2>
								<p className="mt-1 text-sm text-moonlight">This is the only time the full key will be shown.</p>
							</div>
							<button type="button" onClick={() => setNewKey("")} className="text-xs text-ash hover:text-starlight">Dismiss</button>
						</div>
						<div className="mt-4 flex flex-col gap-2 sm:flex-row">
							<code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-solar/20 bg-void/70 px-3 py-3 font-mono text-sm text-starlight">{newKey}</code>
							<button type="button" onClick={() => void copyText(newKey, "API key")} className="btn-primary shrink-0 justify-center">Copy key</button>
						</div>
					</section>
				)}

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
					<section className="glass rounded-2xl p-5 sm:p-7">
						<div className="mb-5 flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.16em] text-ash">Step 01 / Credentials</p>
								<h2 className="mt-1 font-display text-xl font-bold text-starlight">API keys</h2>
							</div>
							<span className="rounded-full border border-dust/25 px-2.5 py-1 text-xs text-moonlight">{keys.filter((key) => !key.revoked_at).length} active</span>
						</div>

						<form onSubmit={createKey} className="mb-6 flex flex-col gap-2 sm:flex-row">
							<label className="min-w-0 flex-1">
								<span className="sr-only">Key name</span>
								<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Key name, e.g. Local prototype" className="w-full rounded-xl border border-dust/30 bg-space/80 px-3.5 py-3 text-sm text-starlight placeholder:text-ash/60 focus:border-nova/60 focus:outline-none" />
							</label>
							<button type="submit" disabled={busy || !name.trim()} className="btn-primary shrink-0 justify-center disabled:opacity-50">
								{busy ? "Working..." : "Create key"}
							</button>
						</form>

						{keys.length === 0 ? (
							<div className="rounded-xl border border-dashed border-dust/30 p-6 text-center">
								<p className="text-sm font-medium text-starlight">No keys yet</p>
								<p className="mt-1 text-xs text-ash">Create a key above to make your first API call.</p>
							</div>
						) : (
							<div className="divide-y divide-dust/15">
								{keys.map((key) => (
									<div key={key.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<p className="truncate text-sm font-semibold text-starlight">{key.name}</p>
												<span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
													key.revoked_at
														? "border-dust/30 text-ash"
														: key.tier === "pro"
															? "border-plasma/30 text-plasma-bright"
															: "border-nova/25 text-nova-bright"
												}`}>
													{key.revoked_at ? "Revoked" : key.tier}
												</span>
											</div>
											<p className="mt-1 font-mono text-xs text-ash">{key.prefix}••••••••</p>
											<p className="mt-1 text-[11px] text-ash">Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}</p>
										</div>
										{!key.revoked_at && (
											<button type="button" disabled={busy} onClick={() => void revokeKey(key)} className="btn-ghost self-start text-xs text-supernova hover:border-supernova/40 sm:self-auto">
												Revoke
											</button>
										)}
									</div>
								))}
							</div>
						)}
					</section>

					<aside className="space-y-5">
						<section className="relative overflow-hidden rounded-2xl border border-plasma/30 bg-gradient-to-br from-plasma/15 via-space to-nova/10 p-5">
							<div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-plasma/20" />
							<p className="relative text-xs font-bold uppercase tracking-[0.16em] text-plasma-bright">API Pro</p>
							<h2 className="relative mt-2 font-display text-xl font-bold text-starlight">
								More room to build
							</h2>
							<p className="relative mt-2 text-sm leading-6 text-ash">
								Higher request limits and expanded data access for production integrations.
							</p>
							{apiPro && <p className="relative mt-3 text-sm font-semibold text-moonlight">{apiPro.priceXlm} XLM / {apiPro.durationDays} days</p>}
							<Link href="/pricing#pricing-api_pro" className="btn-primary relative mt-5 inline-flex w-full justify-center">
								Explore API Pro
							</Link>
						</section>
						<section className="glass rounded-2xl p-5">
							<p className="text-xs font-bold uppercase tracking-[0.16em] text-ash">Usage</p>
							<h2 className="mt-1 font-display text-lg font-bold text-starlight">Key activity</h2>
							<p className="mt-2 text-sm leading-6 text-ash">
								Last-used timestamps update whenever an API key successfully authenticates. Revoked keys stop working immediately.
							</p>
						</section>
					</aside>
				</div>

				<section className="mt-7 glass rounded-2xl p-5 sm:p-7">
					<div className="mb-6">
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-ash">Step 02 / First request</p>
						<h2 className="mt-1 font-display text-xl font-bold text-starlight">Make your first call</h2>
						<p className="mt-1 text-sm text-ash">All v1 endpoints return JSON and require an active key in <code className="text-nova-bright">X-API-Key</code>.</p>
					</div>
					<div className="grid gap-5 lg:grid-cols-2">
						<article>
							<div className="mb-2 flex items-center justify-between gap-3">
								<h3 className="text-sm font-semibold text-moonlight">List projects</h3>
								<span className="rounded border border-nova/25 px-2 py-0.5 font-mono text-[10px] text-nova-bright">GET /api/v1/projects</span>
							</div>
							<CodeBlock>{`curl "${API_BASE_URL}/api/v1/projects?limit=10" \\
  -H "X-API-Key: YOUR_API_KEY"`}</CodeBlock>
							<p className="mt-2 text-xs text-ash">Optional: <code>page</code> (default 1) and <code>limit</code> (1–100, default 20).</p>
						</article>
						<article>
							<div className="mb-2 flex items-center justify-between gap-3">
								<h3 className="text-sm font-semibold text-moonlight">List open jobs</h3>
								<span className="rounded border border-nova/25 px-2 py-0.5 font-mono text-[10px] text-nova-bright">GET /api/v1/jobs</span>
							</div>
							<CodeBlock>{`curl "${API_BASE_URL}/api/v1/jobs?type=contract" \\
  -H "X-API-Key: YOUR_API_KEY"`}</CodeBlock>
							<p className="mt-2 text-xs text-ash">Supports job filters: <code>type</code>, <code>category</code>, <code>currency</code>, <code>remote</code>, <code>q</code>, and <code>limit</code>.</p>
						</article>
					</div>

					{newKey && (
						<div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dust/20 bg-space/60 p-4">
							<p className="text-xs text-ash">Run an authenticated request now using the new key.</p>
							<button
								type="button"
								onClick={() => void copyText(`curl "${API_BASE_URL}/api/v1/projects?limit=10" -H "X-API-Key: ${newKey}"`, "Example curl command")}
								className="btn-ghost text-xs"
							>
								Copy ready-to-run curl
							</button>
						</div>
					)}

					<details className="mt-6 rounded-xl border border-dust/20 bg-space/50 p-4">
						<summary className="cursor-pointer text-sm font-semibold text-moonlight">Authentication and response shape</summary>
						<div className="mt-4 grid gap-4 lg:grid-cols-2">
							<CodeBlock>{`{
  "data": [
    { "id": 123, "name": "Example project", "slug": "example-project" }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}`}</CodeBlock>
							<p className="text-xs leading-6 text-ash">
								Keep API keys on your server and out of browser code, source control, and public logs. A missing, invalid, or revoked key returns <code className="text-moonlight">401</code>. Project pagination is included in the response; jobs return an array at <code className="text-moonlight">data</code>.
							</p>
						</div>
					</details>
				</section>
			</div>
		</main>
	);
}
