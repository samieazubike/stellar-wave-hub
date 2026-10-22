import Link from "next/link";

export default function ProjectNotFound() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
			<div className="glass rounded-2xl p-10 sm:p-12 text-center max-w-lg w-full animate-in">
				<div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-nova/30 to-plasma/30 border border-nova/20 flex items-center justify-center text-2xl font-bold text-nova-bright">
					?
				</div>
				<h1 className="font-display font-bold text-2xl sm:text-3xl text-starlight mb-3">
					Project not found
				</h1>
				<p className="text-ash mb-8 leading-relaxed">
					We couldn&apos;t find a project at this address. It may have been renamed, removed, or not submitted yet.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link href="/explore" className="btn-nova inline-flex">
						Back to Explore
					</Link>
					<Link href="/submit" className="btn-ghost inline-flex">
						Submit a project
					</Link>
				</div>
			</div>
		</div>
	);
}
