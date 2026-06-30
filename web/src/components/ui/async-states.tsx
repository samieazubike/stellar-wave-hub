export function ErrorState({
	title = "Something went wrong",
	message = "We couldn't load this content. Please try again.",
	onRetry,
}: {
	title?: string;
	message?: string;
	onRetry?: () => void;
}) {
	return (
		<div className="glass rounded-2xl p-12 text-center">
			<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-supernova/10 border border-supernova/20 flex items-center justify-center">
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--supernova)"
					strokeWidth="1.5"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<h3 className="font-semibold text-lg text-moonlight mb-2">{title}</h3>
			<p className="text-ash mb-6">{message}</p>
			{onRetry && (
				<button onClick={onRetry} className="btn-ghost text-sm">
					Try again
				</button>
			)}
		</div>
	);
}
