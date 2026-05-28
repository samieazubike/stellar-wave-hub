import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getBlogBySlug, getBlogSlugs, type BlogBlock} from "@/lib/blogs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

type Props = {
	params: Promise<{slug: string}>;
};

export function generateStaticParams() {
	return getBlogSlugs().map((slug) => ({slug}));
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

const calloutToneClass: Record<string, string> = {
	nova: "border-nova/30 bg-nova/5 text-moonlight",
	solar: "border-solar/50 bg-solar/10 text-moonlight",
	aurora: "border-aurora/30 bg-aurora/5 text-moonlight",
	plasma: "border-plasma/30 bg-plasma/5 text-moonlight",
};

const calloutTitleToneClass: Record<string, string> = {
	nova: "text-nova-bright",
	solar: "text-solar-bright",
	aurora: "text-aurora-bright",
	plasma: "text-plasma-bright",
};

function Block({block}: {block: BlogBlock}) {
	switch (block.type) {
		case "paragraph":
			return (
				<p className="text-moonlight/90 text-base sm:text-lg leading-relaxed mb-5">
					{block.text}
				</p>
			);
		case "heading": {
			const sizeClass =
				block.level === 2
					? "text-2xl sm:text-3xl mt-10 mb-4"
					: "text-xl sm:text-2xl mt-8 mb-3";
			return block.level === 2 ? (
				<h2 className={`font-display font-bold text-starlight ${sizeClass}`}>
					{block.text}
				</h2>
			) : (
				<h3 className={`font-display font-semibold text-starlight ${sizeClass}`}>
					{block.text}
				</h3>
			);
		}
		case "image":
			return (
				<figure className="my-8">
					<div className="relative w-full overflow-hidden rounded-2xl border border-dust/40 bg-stardust/30">
						<Image
							src={block.src}
							alt={block.alt}
							width={1600}
							height={900}
							className="w-full h-auto"
							sizes="(max-width: 768px) 100vw, 768px"
						/>
					</div>
					{block.caption && (
						<figcaption className="text-center text-sm text-ash mt-3">
							{block.caption}
						</figcaption>
					)}
				</figure>
			);
		case "list": {
			const ListTag = block.ordered ? "ol" : "ul";
			const listClass = block.ordered
				? "list-decimal pl-6 mb-6 space-y-2 marker:text-nova-bright"
				: "list-disc pl-6 mb-6 space-y-2 marker:text-nova-bright";
			return (
				<ListTag className={listClass}>
					{block.items.map((item, i) => (
						<li
							key={i}
							className="text-moonlight/90 text-base sm:text-lg leading-relaxed"
						>
							{item}
						</li>
					))}
				</ListTag>
			);
		}
		case "callout": {
			const tone = block.tone ?? "nova";
			return (
				<div
					className={`rounded-2xl border-2 p-5 sm:p-6 my-6 ${calloutToneClass[tone]}`}
				>
					{block.title && (
						<p
							className={`font-bold text-base sm:text-lg mb-2 ${calloutTitleToneClass[tone]}`}
						>
							{block.title}
						</p>
					)}
					<p className="text-moonlight font-medium leading-relaxed">
						{block.text}
					</p>
				</div>
			);
		}
		case "link-button":
			return block.external ? (
				<a
					href={block.href}
					target="_blank"
					rel="noopener noreferrer"
					className="btn-nova text-sm inline-flex items-center gap-2 my-2"
				>
					{block.label}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M7 17 17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			) : (
				<Link
					href={block.href}
					className="btn-nova text-sm inline-flex items-center gap-2 my-2"
				>
					{block.label}
				</Link>
			);
	}
}

export default async function BlogPostPage({params}: Props) {
	const {slug} = await params;
	const post = getBlogBySlug(slug);
	if (!post) notFound();

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt,
		datePublished: post.publishedAt,
		author: {"@type": "Organization", name: post.author},
		mainEntityOfPage: `${siteUrl}/blogs/${post.slug}`,
		keywords: post.tags.join(", "),
	};

	return (
		<article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
			/>

			<div className="mb-8 animate-in">
				<Link
					href="/blogs"
					className="inline-flex items-center gap-1.5 text-sm text-ash hover:text-starlight transition-colors mb-6"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					Back to blog
				</Link>

				<div className="flex flex-wrap gap-2 mb-5">
					{post.tags.map((t) => (
						<span key={t} className="tag tag-nova">
							{t}
						</span>
					))}
				</div>

				<h1 className="font-display font-bold text-3xl sm:text-5xl text-starlight tracking-tight leading-[1.1] mb-5">
					{post.title}
				</h1>

				<div className="flex flex-wrap items-center gap-3 text-sm text-ash">
					<span className="font-medium text-moonlight">{post.author}</span>
					<span>•</span>
					<span>{formatDate(post.publishedAt)}</span>
					<span>•</span>
					<span>{post.readingMinutes} min read</span>
				</div>
			</div>

			<div className="animate-in animate-in-delay-1">
				{post.intro.map((block, i) => (
					<Block key={`intro-${i}`} block={block} />
				))}

				{post.steps?.map((step) => (
					<section key={step.number} className="mt-12">
						<div className="flex items-center gap-3 mb-4">
							<span className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-nova to-nova-dim text-white font-bold flex items-center justify-center text-sm">
								{step.number}
							</span>
							<h2 className="font-display font-bold text-2xl sm:text-3xl text-starlight leading-tight">
								{step.title}
							</h2>
						</div>
						<div className="pl-0 sm:pl-12">
							{step.blocks.map((block, i) => (
								<Block key={`step-${step.number}-${i}`} block={block} />
							))}
						</div>
					</section>
				))}

				{post.outro && (
					<div className="mt-14 pt-10 border-t border-dust/30">
						{post.outro.map((block, i) => (
							<Block key={`outro-${i}`} block={block} />
						))}
					</div>
				)}
			</div>

			<div className="mt-16 pt-8 border-t border-dust/30 flex flex-col sm:flex-row gap-3">
				<Link href="/blogs" className="btn-ghost text-sm">
					← All posts
				</Link>
				<Link href="/submit" className="btn-nova text-sm">
					Submit a project
				</Link>
			</div>
		</article>
	);
}
