"use client";

import {useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
	"DeFi",
	"Payments",
	"Infrastructure",
	"Identity",
	"Other",
];

export default function SubmitPage() {
	const {user, token} = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		name: "",
		description: "",
		category: "",
		stellar_account_id: "",
		stellar_contract_id: "",
		tags: "",
		website_url: "",
		github_url: "",
		logo_url: "",
	});

	const update = (field: string, value: string) =>
		setForm((prev) => ({...prev, [field]: value}));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (
			!form.stellar_account_id.trim() &&
			!form.stellar_contract_id.trim()
		) {
			setError(
				"Add at least one Stellar account ID or Soroban contract ID before submitting.",
			);
			return;
		}
		setLoading(true);

		try {
			const res = await fetch("/api/projects", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			router.push("/my-projects");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Submission failed");
		}
		setLoading(false);
	};

	if (!user) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4">
				<div className="glass rounded-2xl p-12 text-center max-w-md">
					<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--ash)"
							strokeWidth="1.5"
						>
							<rect
								x="3"
								y="11"
								width="18"
								height="11"
								rx="2"
								ry="2"
							/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
					</div>
					<h2 className="font-semibold text-xl text-starlight mb-2">
						Sign in required
					</h2>
					<p className="text-ash mb-6">
						You need to be signed in to submit a project
					</p>
					<Link href="/login" className="btn-nova inline-flex">
						Sign In
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="mb-8 animate-in">
				<h1 className="font-display font-bold text-3xl text-starlight mb-2">
					Submit a Project
				</h1>
					<p className="text-ash">
					Share a verified Stellar Wave project with the community
					</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="glass rounded-2xl p-8 space-y-6 animate-in animate-in-delay-1"
			>
				{error && (
					<div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-moonlight mb-2">
							Project Name *
						</label>
						<input
							type="text"
							required
							className="input-field"
							placeholder="My Stellar Project"
							value={form.name}
							onChange={(e) => update("name", e.target.value)}
						/>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-moonlight mb-2">
							Description *
						</label>
						<textarea
							required
							rows={4}
							minLength={200}
							className="input-field resize-none"
							placeholder="Write a comprehensive description of at least 200 characters covering the project's mission, technology, and role in the Wave ecosystem."
							value={form.description}
							onChange={(e) =>
								update("description", e.target.value)
							}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							Category *
						</label>
						<select
							required
							className="input-field appearance-none cursor-pointer"
							value={form.category}
							onChange={(e) => update("category", e.target.value)}
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237c7893' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
								backgroundRepeat: "no-repeat",
								backgroundPosition: "right 12px center",
							}}
						>
							<option value="">Select a category</option>
							{CATEGORIES.map((cat) => (
								<option key={cat} value={cat.toLowerCase()}>
									{cat}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							Tags
						</label>
						<input
							type="text"
							className="input-field"
							placeholder="defi, lending, stellar (comma-separated)"
							value={form.tags}
							onChange={(e) => update("tags", e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							Stellar Account ID *
						</label>
						<input
							type="text"
							className="input-field font-mono text-sm"
							placeholder="G..."
							value={form.stellar_account_id}
							onChange={(e) =>
								update("stellar_account_id", e.target.value)
							}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							Soroban Contract ID *
						</label>
						<input
							type="text"
							className="input-field font-mono text-sm"
							placeholder="C..."
							value={form.stellar_contract_id}
							onChange={(e) =>
								update("stellar_contract_id", e.target.value)
							}
						/>
						<p className="text-xs text-ash mt-2">
							Provide at least one on-chain identifier: a Stellar account ID or a Soroban contract ID.
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							Website URL
						</label>
						<input
							type="url"
							className="input-field"
							placeholder="https://myproject.com"
							value={form.website_url}
							onChange={(e) =>
								update("website_url", e.target.value)
							}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-moonlight mb-2">
							GitHub URL
						</label>
						<input
							type="url"
							className="input-field"
							placeholder="https://github.com/..."
							value={form.github_url}
							onChange={(e) =>
								update("github_url", e.target.value)
							}
						/>
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-moonlight mb-2">
							Logo URL
						</label>
						<input
							type="url"
							className="input-field"
							placeholder="https://... (direct image link)"
							value={form.logo_url}
							onChange={(e) => update("logo_url", e.target.value)}
						/>
					</div>
				</div>

				<div className="flex items-center gap-4 pt-4 border-t border-dust/20">
					<button
						type="submit"
						disabled={loading}
						className="btn-nova !py-3 !px-8 disabled:opacity-50"
					>
						{loading ? "Submitting..." : "Submit Project"}
					</button>
					<Link href="/explore" className="btn-ghost !py-3 !px-6">
						Cancel
					</Link>
				</div>

				<p className="text-xs text-ash">
					Your project will be reviewed by an admin before appearing
					publicly.
				</p>
			</form>
		</div>
	);
}
