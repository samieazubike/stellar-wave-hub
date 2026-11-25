"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {useAuth} from "@/context/AuthContext";

interface BookmarksContextValue {
	projectIds: number[];
	loading: boolean;
	error: string | null;
	isBookmarked: (projectId: number) => boolean;
	toggleBookmark: (projectId: number) => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getBookmarkIds(payload: unknown): number[] {
	if (!isRecord(payload) || !Array.isArray(payload.bookmarks)) {
		throw new Error("The bookmarks response was invalid.");
	}

	const bookmarks: unknown[] = payload.bookmarks;
	const ids = bookmarks.flatMap((bookmark) => {
		if (!isRecord(bookmark)) return [];
		const rawId = bookmark.project_id;
		const id = typeof rawId === "number" ? rawId : Number(rawId);
		return Number.isInteger(id) && id > 0 ? [id] : [];
	});

	return [...new Set(ids)];
}

async function getResponseError(response: Response, fallback: string) {
	const payload: unknown = await response.json().catch(() => null);
	return isRecord(payload) && typeof payload.error === "string"
		? payload.error
		: fallback;
}

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

export function BookmarksProvider({children}: {children: ReactNode}) {
	const {token, loading: authLoading} = useAuth();
	const [projectIds, setProjectIds] = useState<number[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading) return;
		if (!token) {
			setProjectIds([]);
			setError(null);
			setLoading(false);
			return;
		}

		let cancelled = false;
		setProjectIds([]);
		setLoading(true);
		setError(null);

		fetch("/api/bookmarks", {
			headers: {Authorization: `Bearer ${token}`},
			cache: "no-store",
		})
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(await getResponseError(response, "Could not load saved projects."));
				}
				return getBookmarkIds(await response.json());
			})
			.then((ids) => {
				if (!cancelled) setProjectIds(ids);
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					const message = getErrorMessage(reason, "Could not load saved projects.");
					setError(message);
					console.error("Could not load saved projects:", reason);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [authLoading, token]);

	const isBookmarked = useCallback(
		(projectId: number) => Boolean(token && projectIds.includes(projectId)),
		[projectIds, token],
	);

	const toggleBookmark = useCallback(
		async (projectId: number) => {
			if (!token) throw new Error("Please sign in to save projects.");

			const wasBookmarked = projectIds.includes(projectId);
			setError(null);
			setProjectIds((current) =>
				wasBookmarked
					? current.filter((id) => id !== projectId)
					: [...current, projectId],
			);

			try {
				const response = await fetch("/api/bookmarks", {
					method: wasBookmarked ? "DELETE" : "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({project_id: projectId}),
				});
				if (!response.ok) {
					throw new Error(await getResponseError(response, "Could not update saved projects."));
				}
			} catch (reason) {
				setProjectIds((current) =>
					wasBookmarked
						? current.includes(projectId)
							? current
							: [...current, projectId]
						: current.filter((id) => id !== projectId),
				);
				const message = getErrorMessage(reason, "Could not update saved projects.");
				setError(message);
				throw new Error(message);
			}
		},
		[projectIds, token],
	);

	const value = useMemo(
		() => ({projectIds, loading, error, isBookmarked, toggleBookmark}),
		[projectIds, loading, error, isBookmarked, toggleBookmark],
	);

	return (
		<BookmarksContext.Provider value={value}>
			{children}
		</BookmarksContext.Provider>
	);
}

export function useBookmarks() {
	const context = useContext(BookmarksContext);
	if (!context) throw new Error("useBookmarks must be used within BookmarksProvider");
	return context;
}
