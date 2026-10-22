import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Page Not Found",
};

export default function NotFound() {
	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
			<div className="glass rounded-2xl p-10 sm:p-12 text-center max-w-lg w-full animate-in">
				<p className="font-display font-extrabold text-7xl sm:text-8xl text-gradient-nova mb-4">404</p>
				<h1 className="font-display font-bold text-2xl sm:text-3xl text-starlight mb-3">
					Lost in space
				</h1>
				<p className="text-ash mb-8 leading-relaxed">
					The page you&apos;re looking for drifted out of orbit or never existed. Let&apos;s get you back on course.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link href="/explore" className="btn-nova inline-flex">
						Explore projects
					</Link>
					<Link href="/" className="btn-ghost inline-flex">
						Go home
					</Link>
				</div>
			</div>
		</div>
	);
}
