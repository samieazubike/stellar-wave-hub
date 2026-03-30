"use client";

import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import {useState} from "react";

export default function Navbar() {
	const {user, logout, loading} = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dust/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-3 group">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nova to-plasma flex items-center justify-center">
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
							</svg>
						</div>
						<span className="font-display font-bold text-lg tracking-tight text-starlight group-hover:text-nova-bright transition-colors">
							Stellar Wave Hub
						</span>
					</Link>

					{/* Desktop nav */}
					<div className="hidden md:flex items-center gap-1">
						<Link
							href="/explore"
							className="px-4 py-2 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50 transition-all"
						>
							Explore
						</Link>
						<Link
							href="/queue"
							className="px-4 py-2 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50 transition-all"
						>
							Queue
						</Link>
						{user && (
							<>
								<Link
									href="/submit"
									className="px-4 py-2 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50 transition-all"
								>
									Submit Project
								</Link>
								<Link
									href="/my-projects"
									className="px-4 py-2 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50 transition-all"
								>
									My Projects
								</Link>
								{user.role === "admin" && (
									<Link
										href="/admin"
										className="px-4 py-2 rounded-lg text-sm font-medium text-solar hover:text-solar-bright hover:bg-solar/10 transition-all"
									>
										Admin
									</Link>
								)}
							</>
						)}
					</div>

					{/* Auth section */}
					<div className="hidden md:flex items-center gap-3">
						{loading ? (
							<div className="w-20 h-8 skeleton" />
						) : user ? (
							<div className="flex items-center gap-3">
								<Link
								href="/profile"
								className="flex items-center gap-2 hover:opacity-80 transition-opacity"
							>
								<div className="w-8 h-8 rounded-full bg-gradient-to-br from-nova to-comet flex items-center justify-center text-xs font-bold text-white">
									{user.username[0].toUpperCase()}
								</div>
								<span className="text-sm font-medium text-moonlight">
									{user.username}
								</span>
							</Link>
								<button
									onClick={logout}
									className="btn-ghost text-sm !py-1.5 !px-3"
								>
									Sign Out
								</button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Link
									href="/login"
									className="btn-ghost text-sm !py-1.5 !px-3"
								>
									Sign In
								</Link>
								<Link
									href="/register"
									className="btn-nova text-sm !py-1.5 !px-3"
								>
									Get Started
								</Link>
							</div>
						)}
					</div>

					{/* Mobile hamburger */}
					<button
						className="md:hidden p-2 rounded-lg hover:bg-stardust/50 transition-colors"
						onClick={() => setMobileOpen(!mobileOpen)}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						>
							{mobileOpen ? (
								<>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</>
							) : (
								<>
									<line x1="3" y1="6" x2="21" y2="6" />
									<line x1="3" y1="12" x2="21" y2="12" />
									<line x1="3" y1="18" x2="21" y2="18" />
								</>
							)}
						</svg>
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="md:hidden glass border-t border-dust/30 px-4 pb-4 pt-2 space-y-1">
					<Link
						href="/explore"
						className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
						onClick={() => setMobileOpen(false)}
					>
						Explore
					</Link>
					<Link
						href="/queue"
						className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
						onClick={() => setMobileOpen(false)}
					>
						Queue
					</Link>
					{user ? (
						<>
							<Link
								href="/profile"
								className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
								onClick={() => setMobileOpen(false)}
							>
								Profile
							</Link>
							<Link
								href="/submit"
								className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
								onClick={() => setMobileOpen(false)}
							>
								Submit Project
							</Link>
							<Link
								href="/my-projects"
								className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
								onClick={() => setMobileOpen(false)}
							>
								My Projects
							</Link>
							{user.role === "admin" && (
								<Link
									href="/admin"
									className="block px-4 py-2.5 rounded-lg text-sm font-medium text-solar hover:text-solar-bright hover:bg-solar/10"
									onClick={() => setMobileOpen(false)}
								>
									Admin
								</Link>
							)}
							<div className="pt-2 border-t border-dust/30">
								<button
									onClick={() => {
										logout();
										setMobileOpen(false);
									}}
									className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-supernova hover:bg-supernova/10"
								>
									Sign Out
								</button>
							</div>
						</>
					) : (
						<div className="pt-2 border-t border-dust/30 flex gap-2">
							<Link
								href="/login"
								className="btn-ghost text-sm flex-1 text-center"
								onClick={() => setMobileOpen(false)}
							>
								Sign In
							</Link>
							<Link
								href="/register"
								className="btn-nova text-sm flex-1 text-center"
								onClick={() => setMobileOpen(false)}
							>
								Get Started
							</Link>
						</div>
					)}
				</div>
			)}
		</nav>
	);
}
