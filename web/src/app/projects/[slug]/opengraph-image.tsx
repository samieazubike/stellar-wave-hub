import {ImageResponse} from "next/og";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {projectsCol, ratingsCol} from "@/lib/db";

export const alt = "Project on Stellar Wave Hub";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";
export const revalidate = 300;

type ShareCard = {
	name: string;
	category: string;
	description: string;
	avgScore: number | null;
	totalRatings: number;
};

function truncate(text: string, max: number) {
	const clean = text.replace(/\s+/g, " ").trim();
	return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

async function loadShareCard(slug: string): Promise<ShareCard | null> {
	try {
		const snap = await projectsCol.ref.where("slug", "==", slug).limit(1).get();
		if (snap.empty) return null;
		const project = snap.docs[0].data();

		let avgScore: number | null = null;
		let totalRatings = 0;
		try {
			const rSnap = await ratingsCol.ref
				.where("project_id", "==", project.numericId)
				.get();
			const scores = rSnap.docs
				.map((d) => Number(d.data().score))
				.filter((s) => Number.isFinite(s) && s > 0);
			totalRatings = scores.length;
			if (scores.length > 0) {
				avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
			}
		} catch {
			// Ratings are optional on the card — render without them
		}

		return {
			name: truncate(String(project.name ?? slug), 60),
			category: String(project.category ?? ""),
			description: truncate(String(project.description ?? ""), 150),
			avgScore,
			totalRatings,
		};
	} catch {
		// DB unavailable — fall back to the generic card instead of erroring
		return null;
	}
}

async function loadLogoDataUri(): Promise<string | null> {
	try {
		const svg = await readFile(join(process.cwd(), "public", "logo-icon.svg"));
		return `data:image/svg+xml;base64,${svg.toString("base64")}`;
	} catch {
		return null;
	}
}

function Star({filled}: {filled: boolean}) {
	return (
		<svg width="36" height="36" viewBox="0 0 24 24">
			<polygon
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				fill={filled ? "#fbbf24" : "#3d3856"}
			/>
		</svg>
	);
}

export default async function Image({params}: {params: Promise<{slug: string}>}) {
	const {slug} = await params;
	const [card, logo] = await Promise.all([loadShareCard(slug), loadLogoDataUri()]);

	const brand = (
		<div style={{display: "flex", alignItems: "center", gap: 16}}>
			{logo ? <img src={logo} width={56} height={56} alt="" /> : null}
			<div style={{display: "flex", fontSize: 30, fontWeight: 700, color: "#f0eef6"}}>
				Stellar Wave Hub
			</div>
		</div>
	);

	const background = {
		backgroundColor: "#06060f",
		backgroundImage:
			"radial-gradient(circle at 15% 0%, rgba(124, 58, 237, 0.45), rgba(6, 6, 15, 0) 55%), radial-gradient(circle at 95% 75%, rgba(6, 182, 212, 0.28), rgba(6, 6, 15, 0) 50%)",
	};

	// Generic fallback for unknown slugs or when the DB is unreachable
	if (!card) {
		return new ImageResponse(
			(
				<div
					style={{
						...background,
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: 72,
						fontFamily: "sans-serif",
					}}
				>
					{brand}
					<div style={{display: "flex", flexDirection: "column", gap: 20}}>
						<div style={{display: "flex", fontSize: 68, fontWeight: 800, color: "#f0eef6", lineHeight: 1.1}}>
							Discover Stellar Wave projects
						</div>
						<div style={{display: "flex", fontSize: 32, color: "#c4c0d4"}}>
							Explore, rate, and track projects built through the Stellar Wave Program.
						</div>
					</div>
					<div style={{display: "flex", fontSize: 26, color: "#a78bfa"}}>stellarwavehub.com</div>
				</div>
			),
			size,
		);
	}

	const rounded = card.avgScore !== null ? Math.round(card.avgScore) : 0;

	return new ImageResponse(
		(
			<div
				style={{
					...background,
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: 72,
					fontFamily: "sans-serif",
				}}
			>
				{brand}

				<div style={{display: "flex", alignItems: "center", gap: 36}}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 148,
							height: 148,
							flexShrink: 0,
							borderRadius: 36,
							border: "2px solid rgba(124, 58, 237, 0.45)",
							backgroundImage: "linear-gradient(135deg, rgba(124, 58, 237, 0.45), rgba(6, 182, 212, 0.4))",
							fontSize: 80,
							fontWeight: 800,
							color: "#a78bfa",
						}}
					>
						{card.name.charAt(0).toUpperCase()}
					</div>
					<div style={{display: "flex", flexDirection: "column", gap: 16, flex: 1, minWidth: 0}}>
						<div
							style={{
								display: "flex",
								fontSize: card.name.length > 28 ? 56 : 72,
								fontWeight: 800,
								color: "#f0eef6",
								lineHeight: 1.05,
							}}
						>
							{card.name}
						</div>
						{card.category ? (
							<div style={{display: "flex"}}>
								<div
									style={{
										display: "flex",
										padding: "8px 22px",
										borderRadius: 999,
										fontSize: 26,
										fontWeight: 600,
										textTransform: "uppercase",
										letterSpacing: 2,
										color: "#22d3ee",
										backgroundColor: "rgba(6, 182, 212, 0.14)",
										border: "1px solid rgba(6, 182, 212, 0.4)",
									}}
								>
									{card.category}
								</div>
							</div>
						) : null}
					</div>
				</div>

				{card.description ? (
					<div style={{display: "flex", fontSize: 28, color: "#c4c0d4", lineHeight: 1.4}}>
						{card.description}
					</div>
				) : null}

				<div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
					{card.avgScore !== null ? (
						<div style={{display: "flex", alignItems: "center", gap: 18}}>
							<div style={{display: "flex", gap: 4}}>
								{[1, 2, 3, 4, 5].map((i) => (
									<Star key={i} filled={i <= rounded} />
								))}
							</div>
							<div style={{display: "flex", fontSize: 36, fontWeight: 700, color: "#fbbf24"}}>
								{card.avgScore.toFixed(1)}
							</div>
							<div style={{display: "flex", fontSize: 26, color: "#7c7893"}}>
								{`${card.totalRatings} rating${card.totalRatings === 1 ? "" : "s"}`}
							</div>
						</div>
					) : (
						<div style={{display: "flex", fontSize: 28, color: "#7c7893"}}>Not yet rated — be the first</div>
					)}
					<div style={{display: "flex", fontSize: 26, color: "#a78bfa"}}>stellarwavehub.com</div>
				</div>
			</div>
		),
		size,
	);
}
