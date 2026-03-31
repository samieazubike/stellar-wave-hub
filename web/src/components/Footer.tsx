import Link from "next/link";
import Image from "next/image";

export default function Footer() {
	return (
		<footer className="border-t border-dust/30 bg-nebula/50 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="md:col-span-2">
						<div className="flex items-center gap-3 mb-4">
							<Image
								src="/logo-icon.svg"
								alt="Stellar Wave Hub"
								width={32}
								height={32}
								className="w-8 h-8"
							/>
							<span className="font-display font-bold text-lg text-starlight">
								Stellar Wave Hub
							</span>
						</div>
						<p className="text-sm text-ash max-w-sm leading-relaxed">
							A community-driven project directory for the Stellar
							Wave Program. Discover, rate, and track blockchain
							projects built on Stellar.
						</p>
					</div>
					<div>
						<h4 className="font-semibold text-moonlight text-sm uppercase tracking-wider mb-4">
							Platform
						</h4>
						<div className="space-y-2.5">
							<Link
								href="/explore"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Explore Projects
							</Link>
							<Link
								href="/submit"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Submit a Project
							</Link>
							<Link
								href="/register"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Create Account
							</Link>
						</div>
					</div>
					<div>
						<h4 className="font-semibold text-moonlight text-sm uppercase tracking-wider mb-4">
							Ecosystem
						</h4>
						<div className="space-y-2.5">
							<a
								href="https://stellar.org"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Stellar.org
							</a>
							<a
								href="https://horizon.stellar.org"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Horizon API
							</a>
							<a
								href="https://soroban.stellar.org"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-sm text-ash hover:text-starlight transition-colors"
							>
								Soroban Docs
							</a>
						</div>
					</div>
				</div>
				<div className="mt-10 pt-6 border-t border-dust/20 text-center text-xs text-ash">
					Built by{" "}
					<a href="https://samieazubike.work" className="underline">
						Samie Azubike
					</a>{" "}
					for the Stellar Wave Program community
				</div>
			</div>
		</footer>
	);
}
