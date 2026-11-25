import { ImageResponse } from "next/og";

export const alt = "Stellar Wave Hub — Discover Stellar Wave Projects";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OgImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "1200px",
					height: "630px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					background:
						"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 85% 55%, rgba(6,182,212,0.18) 0%, transparent 70%), #06060f",
					fontFamily: "system-ui, -apple-system, sans-serif",
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Subtle grid pattern overlay */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundImage:
							"radial-gradient(circle, rgba(167,139,250,0.12) 1px, transparent 1px)",
						backgroundSize: "48px 48px",
					}}
				/>

				{/* Accent glow orb — top left */}
				<div
					style={{
						position: "absolute",
						top: "-80px",
						left: "-80px",
						width: "400px",
						height: "400px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
					}}
				/>

				{/* Accent glow orb — bottom right */}
				<div
					style={{
						position: "absolute",
						bottom: "-100px",
						right: "-60px",
						width: "360px",
						height: "360px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)",
					}}
				/>

				{/* Star-burst icon (SVG inlined as background element) */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: "36px",
					}}
				>
					{/* Hexagonal star shape via clip-path */}
					<div
						style={{
							width: "96px",
							height: "96px",
							background:
								"linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #06b6d4 100%)",
							clipPath:
								"polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
							filter: "drop-shadow(0 0 24px rgba(167,139,250,0.7))",
						}}
					/>
				</div>

				{/* Title */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0px",
					}}
				>
					<div
						style={{
							fontSize: "72px",
							fontWeight: 800,
							letterSpacing: "-2px",
							lineHeight: 1.05,
							background:
								"linear-gradient(90deg, #a78bfa 0%, #f0eef6 50%, #22d3ee 100%)",
							WebkitBackgroundClip: "text",
							color: "transparent",
							textAlign: "center",
						}}
					>
						Stellar Wave Hub
					</div>

					{/* Wave decoration under title */}
					<svg
						width="480"
						height="28"
						viewBox="0 0 480 28"
						style={{ marginTop: "8px", marginBottom: "24px" }}
					>
						<path
							d="M20,14 Q80,4 120,14 Q160,24 200,14 Q240,4 280,14 Q320,24 360,14 Q400,4 460,14"
							stroke="#06b6d4"
							strokeWidth="3"
							strokeLinecap="round"
							fill="none"
							opacity="0.9"
						/>
						<path
							d="M30,18 Q85,9 130,18 Q170,26 210,18 Q250,9 290,18 Q330,26 370,18 Q410,9 455,18"
							stroke="#7c3aed"
							strokeWidth="2.5"
							strokeLinecap="round"
							fill="none"
							opacity="0.7"
						/>
					</svg>

					<div
						style={{
							fontSize: "28px",
							fontWeight: 400,
							color: "#c4c0d4",
							textAlign: "center",
							maxWidth: "820px",
							lineHeight: 1.4,
						}}
					>
						Discover, rate, and track projects built through the Stellar Wave
						Program
					</div>
				</div>

				{/* Bottom tag strip */}
				<div
					style={{
						position: "absolute",
						bottom: "40px",
						display: "flex",
						gap: "16px",
						alignItems: "center",
					}}
				>
					{["Explore", "Submit", "Rate", "On-chain"].map((tag) => (
						<div
							key={tag}
							style={{
								padding: "6px 18px",
								borderRadius: "9999px",
								border: "1px solid rgba(124,58,237,0.45)",
								background: "rgba(124,58,237,0.12)",
								color: "#a78bfa",
								fontSize: "18px",
								fontWeight: 500,
							}}
						>
							{tag}
						</div>
					))}
					<div
						style={{
							marginLeft: "24px",
							color: "#7c7893",
							fontSize: "18px",
						}}
					>
						stellarwavehub.com
					</div>
				</div>
			</div>
		),
		{ ...size },
	);
}
