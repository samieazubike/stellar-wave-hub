import type {Metadata} from "next";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";
import {QueryProvider} from "@/components/QueryProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
	title: "Stellar Wave Hub",
	description:
		"Discover, rate, and track projects built through the Stellar Wave Program",
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
