import type {Metadata} from "next";
import {getBlogBySlug, getBlogSlugs} from "@/lib/blogs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

type Props = {
	params: Promise<{slug: string}>;
	children: React.ReactNode;
};

export function generateStaticParams() {
	return getBlogSlugs().map((slug) => ({slug}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
	const {slug} = await params;
	const post = getBlogBySlug(slug);
	const canonical = new URL(`/blogs/${slug}`, siteUrl).toString();

	if (!post) {
		return {
			title: "Post Not Found",
			alternates: {canonical},
		};
	}

	const title = post.title;
	const description = post.excerpt;
	const url = `${siteUrl}/blogs/${slug}`;

	return {
		title,
		description,
		alternates: {canonical},
		openGraph: {
			type: "article",
			title,
			description,
			url,
			siteName: "Stellar Wave Hub",
			publishedTime: post.publishedAt,
			authors: [post.author],
			tags: post.tags,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
	};
}

export default function BlogPostLayout({children}: Props) {
	return children;
}
