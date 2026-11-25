"use client";

import Link from "next/link";
import {useState} from "react";
import {useAuth} from "@/context/AuthContext";
import {useBookmarks} from "@/context/BookmarksContext";

interface BookmarkButtonProps {
	projectId: number;
	projectName: string;
	size?: "card" | "detail";
}

export default function BookmarkButton({
	projectId,
	projectName,
	size = "card",
}: BookmarkButtonProps) {
	const {token, loading: authLoading} = useAuth();
	const {isBookmarked, loading: bookmarksLoading, toggleBookmark} = useBookmarks();
	const [busy, setBusy] = useState(false);
	const [signInPromptOpen, setSignInPromptOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bookmarked = isBookmarked(projectId);

	async function handleClick() {
		setError(null);
		if (!token) {
			setSignInPromptOpen(true);
			return;
		}

		setBusy(true);
		try {
			await toggleBookmark(projectId);
			setSignInPromptOpen(false);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not update saved projects.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => void handleClick()}
				disabled={authLoading || bookmarksLoading || busy}
				aria-pressed={bookmarked}
				aria-label={
					bookmarked
						? `Remove ${projectName} from saved projects`
						: `Save ${projectName}`
				}
				title={
					bookmarked
						? `Remove ${projectName} from saved projects`
						: `Save ${projectName}`
				}
				className={`inline-flex shrink-0 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
					size === "detail"
						? "h-10 gap-2 border-dust/30 bg-stardust/50 px-4 text-sm font-medium text-moonlight hover:border-nova/40 hover:text-nova-bright"
						: "h-11 w-11 border-dust/30 bg-stardust/50 text-moonlight hover:border-nova/40 hover:text-nova-bright"
				} ${
					bookmarked
						? "border-supernova/40 bg-supernova/10 text-supernova hover:border-supernova/60"
						: ""
				}`}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill={bookmarked ? "currentColor" : "none"}
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
				</svg>
				{size === "detail" && (bookmarked ? "Saved" : "Save project")}
			</button>

			{signInPromptOpen && !token && (
				<div
					role="status"
					className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-dust/30 bg-space/95 p-3 text-sm shadow-xl"
				>
					<p className="text-moonlight">Sign in to save this project.</p>
					<div className="mt-2 flex items-center justify-between">
						<Link href="/login" className="text-nova-bright hover:underline">
							Sign in
						</Link>
						<button
							type="button"
							onClick={() => setSignInPromptOpen(false)}
							className="text-ash hover:text-starlight"
						>
							Dismiss
						</button>
					</div>
				</div>
			)}

			{error && (
				<p
					role="alert"
					className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-supernova/30 bg-space/95 p-3 text-xs text-supernova shadow-xl"
				>
					{error}
				</p>
			)}
		</div>
	);
}
