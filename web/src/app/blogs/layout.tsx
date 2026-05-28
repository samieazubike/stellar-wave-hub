import type {Metadata} from "next";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"Guides, tutorials, and announcements from the Stellar Wave Hub team — how to research projects on Drips, submit to the Hub, and navigate the Stellar Wave Program.",
	alternates: {canonical: "/blogs"},
};

export default function BlogsLayout({children}: {children: React.ReactNode}) {
	return children;
}
