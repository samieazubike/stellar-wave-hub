import type {Metadata} from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"Guides, tutorials, and announcements from the Stellar Wave Hub team — how to research projects on Drips, submit to the Hub, and navigate the Stellar Wave Program.",
	alternates: {canonical: new URL("/blogs", siteUrl).toString()},
};

export default function BlogsLayout({children}: {children: React.ReactNode}) {
	return children;
}
