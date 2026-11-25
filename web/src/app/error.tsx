"use client";

import {useEffect} from "react";
import Link from "next/link";

export default function ErrorPage({
	error,
	unstable_retry,
}: {
	error: Error & {digest?: string};
	unstable_retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
			<div className="glass rounded-2xl p-10 sm:p-12 text-center max-w-lg w-full animate-in">
				<div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-supernova/30 to-comet/30 border border-supernova/30 flex items-center justify-center">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--supernova)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				</div>
				<h1 className="font-display font-bold text-2xl sm:text-3xl text-starlight mb-3">
					Something went wrong
				</h1>
				<p className="text-ash mb-8 leading-relaxed">
					An unexpected error interrupted this page. It may be temporary — try again, or head back to Explore.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<button type="button" onClick={() => unstable_retry()} className="btn-nova inline-flex">
						Try again
					</button>
					<Link href="/explore" className="btn-ghost inline-flex">
						Back to Explore
					</Link>
				</div>
				{error.digest && (
					<p className="mt-8 text-xs text-dust font-mono">Error ID: {error.digest}</p>
				)}
			</div>
		</div>
	);
}
