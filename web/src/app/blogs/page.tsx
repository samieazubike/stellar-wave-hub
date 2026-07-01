import Link from "next/link";
import {getAllBlogs} from "@/lib/blogs";

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default function BlogsPage() {
	const posts = getAllBlogs();
	const [featured, ...rest] = posts;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Header */}
			<div className="mb-12 animate-in">
				<span className="tag tag-nova mb-4 inline-flex">Stellar Wave Hub Blog</span>
				<h1 className="font-display font-bold text-3xl sm:text-5xl text-starlight mb-3 tracking-tight">
					Guides, tutorials, and updates
				</h1>
				<p className="text-ash text-lg max-w-2xl">
					Practical writing about the Stellar Wave Program, the projects in it,
					and how to make the most of Stellar Wave Hub.
				</p>
			</div>

			{featured && (
				<Link
					href={`/blogs/${featured.slug}`}
					className="block glass glass-hover rounded-3xl p-6 sm:p-10 mb-10 animate-in animate-in-delay-1 transition-all"
				>
					<div className="flex flex-wrap items-center gap-2 mb-4">
						<span className="tag tag-solar">Featured</span>
						{featured.tags.slice(0, 2).map((t) => (
							<span key={t} className="tag tag-plasma">
								{t}
							</span>
						))}
					</div>
					<h2 className="font-display font-bold text-2xl sm:text-4xl text-starlight mb-3 leading-tight">
						{featured.title}
					</h2>
					<p className="text-moonlight/80 text-base sm:text-lg max-w-3xl mb-6 leading-relaxed">
						{featured.excerpt}
					</p>
					<div className="flex flex-wrap items-center gap-4 text-sm text-ash">
						<span className="font-medium text-moonlight">{featured.author}</span>
						<span>•</span>
						<span>{formatDate(featured.publishedAt)}</span>
						<span>•</span>
						<span>{featured.readingMinutes} min read</span>
					</div>
				</Link>
			)}

			{rest.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{rest.map((post, i) => (
						<Link
							key={post.slug}
							href={`/blogs/${post.slug}`}
							className={`glass glass-hover rounded-2xl p-6 flex flex-col transition-all animate-in animate-in-delay-${
								Math.min(i + 2, 5)
							}`}
						>
							<div className="flex flex-wrap gap-2 mb-3">
								{post.tags.slice(0, 2).map((t) => (
									<span key={t} className="tag tag-nova">
										{t}
									</span>
								))}
							</div>
							<h3 className="font-display font-bold text-xl text-starlight mb-2 leading-tight">
								{post.title}
							</h3>
							<p className="text-ash text-sm mb-6 leading-relaxed flex-1">
								{post.excerpt}
							</p>
							<div className="flex items-center gap-2 text-xs text-ash">
								<span>{formatDate(post.publishedAt)}</span>
								<span>•</span>
								<span>{post.readingMinutes} min read</span>
							</div>
						</Link>
					))}
				</div>
			) : posts.length === 0 ? (
				<div className="glass rounded-2xl p-16 text-center">
					<h3 className="font-semibold text-lg text-moonlight mb-2">
						No posts yet
					</h3>
					<p className="text-ash">Check back soon — we're writing.</p>
				</div>
			) : null}
		</div>
	);
}
