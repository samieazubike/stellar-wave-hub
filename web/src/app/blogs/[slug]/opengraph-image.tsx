import { ImageResponse } from "next/og";
import { getBlogBySlug, getBlogSlugs } from "@/lib/blogs";

export const alt = "Stellar Wave Hub Blog";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export function generateStaticParams() {
	return getBlogSlugs().map((slug) => ({ slug }));
}

type Props = {
	params: Promise<{ slug: string }>;
};

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default async function OgImage({ params }: Props) {
	const { slug } = await params;
	const post = getBlogBySlug(slug);

	const title = post?.title ?? "Stellar Wave Hub Blog";
	const date = post?.publishedAt ? formatDate(post.publishedAt) : "";
	const author = post?.author ?? "Stellar Wave Hub Team";
	const tags = post?.tags ?? [];

	return new ImageResponse(
		(
			<div
				style={{
					width: "1200px",
					height: "630px",
					display: "flex",
					flexDirection: "column",
					background:
						"radial-gradient(ellipse 70% 55% at 50% -5%, rgba(124,58,237,0.3) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 60%, rgba(6,182,212,0.15) 0%, transparent 65%), #06060f",
					fontFamily: "system-ui, -apple-system, sans-serif",
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Grid dot pattern */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundImage:
							"radial-gradient(circle, rgba(167,139,250,0.1) 1px, transparent 1px)",
						backgroundSize: "48px 48px",
					}}
				/>

				{/* Top-right glow */}
				<div
					style={{
						position: "absolute",
						top: "-60px",
						right: "-60px",
						width: "350px",
						height: "350px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)",
					}}
				/>

				{/* Bottom-left glow */}
				<div
					style={{
						position: "absolute",
						bottom: "-80px",
						left: "-40px",
						width: "320px",
						height: "320px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)",
					}}
				/>

				{/* Top bar — branding */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "14px",
						padding: "36px 56px 0",
						position: "relative",
					}}
				>
					{/* Mini star icon */}
					<div
						style={{
							width: "36px",
							height: "36px",
							background:
								"linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #06b6d4 100%)",
							clipPath:
								"polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
						}}
					/>
					<span
						style={{
							fontSize: "22px",
							fontWeight: 700,
							background:
								"linear-gradient(90deg, #a78bfa 0%, #22d3ee 100%)",
							WebkitBackgroundClip: "text",
							color: "transparent",
							letterSpacing: "0.5px",
						}}
					>
						Stellar Wave Hub
					</span>
					<span
						style={{
							marginLeft: "8px",
							padding: "4px 14px",
							borderRadius: "9999px",
							border: "1px solid rgba(124,58,237,0.4)",
							background: "rgba(124,58,237,0.1)",
							color: "#a78bfa",
							fontSize: "16px",
							fontWeight: 500,
						}}
					>
						Blog
					</span>
				</div>

				{/* Main content area */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						padding: "32px 56px 44px",
						justifyContent: "flex-end",
						position: "relative",
					}}
				>
					{/* Tags */}
					{tags.length > 0 && (
						<div
							style={{
								display: "flex",
								gap: "10px",
								marginBottom: "20px",
								flexWrap: "nowrap",
							}}
						>
							{tags.slice(0, 4).map((tag) => (
								<div
									key={tag}
									style={{
										padding: "4px 14px",
										borderRadius: "9999px",
										border: "1px solid rgba(6,182,212,0.4)",
										background: "rgba(6,182,212,0.08)",
										color: "#22d3ee",
										fontSize: "17px",
										fontWeight: 500,
									}}
								>
									{tag}
								</div>
							))}
						</div>
					)}

					{/* Post title */}
					<div
						style={{
							fontSize: title.length > 60 ? "44px" : "56px",
							fontWeight: 800,
							color: "#f0eef6",
							lineHeight: 1.15,
							letterSpacing: "-1px",
							maxWidth: "1000px",
							marginBottom: "28px",
						}}
					>
						{title}
					</div>

					{/* Divider wave */}
					<svg
						width="320"
						height="16"
						viewBox="0 0 320 16"
						style={{ marginBottom: "24px" }}
					>
						<path
							d="M0,8 Q40,2 80,8 Q120,14 160,8 Q200,2 240,8 Q280,14 320,8"
							stroke="url(#waveGrad)"
							strokeWidth="2.5"
							strokeLinecap="round"
							fill="none"
						/>
						<defs>
							<linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stopColor="#7c3aed" />
								<stop offset="100%" stopColor="#06b6d4" />
							</linearGradient>
						</defs>
					</svg>

					{/* Author + date */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "20px",
							color: "#7c7893",
							fontSize: "19px",
						}}
					>
						{/* Author avatar placeholder */}
						<div
							style={{
								width: "40px",
								height: "40px",
								borderRadius: "50%",
								background:
									"linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#f0eef6",
								fontSize: "17px",
								fontWeight: 700,
								flexShrink: 0,
							}}
						>
							{author.charAt(0).toUpperCase()}
						</div>
						<span style={{ color: "#c4c0d4", fontWeight: 500 }}>{author}</span>
						{date && (
							<>
								<span style={{ color: "#3d3856" }}>•</span>
								<span>{date}</span>
							</>
						)}
					</div>
				</div>
			</div>
		),
		{ ...size },
	);
}
