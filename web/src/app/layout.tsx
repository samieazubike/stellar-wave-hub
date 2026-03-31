import type {Metadata} from "next";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";
import {QueryProvider} from "@/components/QueryProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

export const metadata: Metadata = {
	title: {
		default: "Stellar Wave Hub — Discover Stellar Wave Projects",
		template: "%s | Stellar Wave Hub",
	},
	description:
		"Discover, rate, and track projects built through the Stellar Wave Program. Explore innovative blockchain research and decentralized applications on Stellar.",
	keywords: [
		"Stellar",
		"Stellar Wave",
		"blockchain",
		"Stellar projects",
		"decentralized applications",
		"dApps",
		"Stellar network",
		"crypto research",
		"Web3",
		"Stellar Wave Hub",
	],
	metadataBase: new URL(siteUrl),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		siteName: "Stellar Wave Hub",
		title: "Stellar Wave Hub — Discover Stellar Wave Projects",
		description:
			"Discover, rate, and track innovative projects built through the Stellar Wave Program.",
		url: siteUrl,
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "Stellar Wave Hub — Discover Stellar Wave Projects",
		description:
			"Discover, rate, and track innovative projects built through the Stellar Wave Program.",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/logo-icon.svg", type: "image/svg+xml" },
		],
		apple: "/logo-icon.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col font-display bg-cosmic noise">
				<div className="starfield" />
				<QueryProvider>
					<AuthProvider>
						<Navbar />
						<main className="flex-1 relative z-10 pt-16">
							{children}
						</main>
						<Footer />
					</AuthProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
