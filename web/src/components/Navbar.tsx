"use client";

import Link from "next/link";
import Image from "next/image";
import {useAuth} from "@/context/AuthContext";
import {hasMinRole} from "@/lib/roles";
import {useState} from "react";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import NotificationsMenu from "@/components/NotificationsMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
	const {user, logout, loading} = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dust/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-3 group">
						<Image
							src="/logo-icon.svg"
							alt="Stellar Wave Hub"
							width={32}
							height={32}
							className="w-8 h-8"
							priority
						/>
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
						<Link
							href="/blogs"
							className="px-4 py-2 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50 transition-all"
						>
							Blog
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
								{hasMinRole(user.role, "maintainer") && (
									<Link
										href="/maintainer"
										className="px-4 py-2 rounded-lg text-sm font-medium text-solar hover:text-solar-bright hover:bg-solar/10 transition-all"
									>
										Maintainer
									</Link>
								)}
								{hasMinRole(user.role, "admin") && (
									<Link
										href="/admin"
										className="px-4 py-2 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all"
									>
										Admin
									</Link>
								)}
							</>
						)}
					</div>

					{/* Auth section */}
					<div className="hidden md:flex items-center gap-3">
						<ThemeToggle />
						{loading ? (
							<div className="w-20 h-8 skeleton" />
						) : user ? (
							<div className="flex items-center gap-3">
								<Link
								href="/profile"
								className="flex items-center gap-2 hover:opacity-80 transition-opacity"
							>
								<Avatar username={user.username} avatarUrl={user.avatar_url} />
								<div className="flex flex-col">
									<span className="text-sm font-medium text-moonlight">
										{user.username}
									</span>
									<RoleBadge role={user.role as "contributor" | "maintainer" | "admin"} />
								</div>
							</Link>
							<NotificationsMenu />
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
					<ThemeToggle className="md:hidden" />
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
					<Link
						href="/blogs"
						className="block px-4 py-2.5 rounded-lg text-sm font-medium text-moonlight hover:text-starlight hover:bg-stardust/50"
						onClick={() => setMobileOpen(false)}
					>
						Blog
					</Link>
					{user ? (
						<>
							<div className="px-4 py-2.5">
								<div className="flex items-center gap-3 mb-2">
									<Avatar username={user.username} avatarUrl={user.avatar_url} className="w-10 h-10" />
									<div>
										<div className="text-sm font-medium text-starlight">{user.username}</div>
										<RoleBadge role={user.role as "contributor" | "maintainer" | "admin"} />
									</div>
								</div>
							</div>
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
							{hasMinRole(user.role, "maintainer") && (
								<Link
									href="/maintainer"
									className="block px-4 py-2.5 rounded-lg text-sm font-medium text-solar hover:text-solar-bright hover:bg-solar/10"
									onClick={() => setMobileOpen(false)}
								>
									Maintainer
								</Link>
							)}
							{hasMinRole(user.role, "admin") && (
								<Link
									href="/admin"
									className="block px-4 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
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
