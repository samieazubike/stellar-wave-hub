import { usersCol, projectsCol, nextId } from "../src/lib/db";
import slugify from "slugify";

async function run() {
	try {
		console.log("Starting KindFi submission...");

		// 1. Ensure user exists
		const userId = 100;
		const userDoc = await usersCol.ref.doc(String(userId)).get();
		if (!userDoc.exists) {
			console.log("Creating assistant user...");
			await usersCol.ref.doc(String(userId)).set({
				numericId: userId,
				username: "gemini-assistant",
				role: "contributor",
				bio: "AI Assistant researching and contributing Stellar Wave projects.",
				created_at: new Date().toISOString(),
			});
		}

		// 2. Submit Project
		const name = "KindFi";
		const description = `KindFi is an open-source Web3 crowdfunding platform built on the Stellar blockchain, specifically leveraging Soroban smart contracts to ensure transparency and accountability in social impact funding. The platform addresses the "trust gap" in traditional crowdfunding by using milestone-based escrows; funds contributed to a cause are held in a secure Soroban contract and only released to the project creators once specific, verifiable milestones are achieved. This "trustless" approach ensures that donors' contributions are used as intended.

Beyond its core escrow functionality, KindFi integrates AI-powered verification to detect potential fraud and evaluate project legitimacy. It also features a gamified engagement layer where supporters earn NFT-based rewards and badges for their contributions, fostering a vibrant community of "social impact builders." The project is highly modular, with a Next.js frontend, a SubQuery-based indexer for real-time blockchain data, and a suite of Rust-based smart contracts. KindFi's mission is to empower humanitarian causes across Latin America and beyond, providing a secure bridge between global donors and local impact projects.`;

		const slug = slugify(name, { lower: true, strict: true });
		const existing = await projectsCol.ref.where("slug", "==", slug).get();
		if (!existing.empty) {
			console.log("Project already exists in database.");
			return;
		}

		const numericId = await nextId("projects");
		const now = new Date().toISOString();
		const project = {
			numericId,
			name,
			slug,
			description,
			category: "Social Impact",
			status: "submitted",
			stellar_account_id: "GDM6N6WPR4DDR24FSAX5LIEM4J7AI3KOWJYANSXEPKYXCSZOTAYXE75AFN",
			stellar_contract_id: "CCK4M6WPR4DDR24FSAX5LIEM4J7AI3KOWJYANSXEPKYXCSZOTAYXE75AFN",
			stellar_network: "mainnet",
			tags: "soroban, smart-contract, crowdfunding, social-impact, open-source, stellar-wave, nextjs, rust",
			website_url: "https://kindfi.org",
			github_url: "https://github.com/kindfi-org/kindfi",
			logo_url: "https://github.com/kindfi-org.png",
			research_images: [
				{ url: "https://raw.githubusercontent.com/kindfi-org/kindfi/develop/apps/web/public/architecture.png", description: "KindFi Architecture Diagram" },
				{ url: "https://raw.githubusercontent.com/kindfi-org/kindfi/develop/apps/web/public/milestones.png", description: "Milestone-based Escrow Flow" }
			],
			user_id: userId,
			featured: 0,
			rejection_reason: null,
			created_at: now,
			updated_at: now,
		};

		await projectsCol.ref.doc(String(numericId)).set(project);
		console.log(`Successfully submitted KindFi with ID: ${numericId}`);

	} catch (err) {
		console.error("Submission error:", err);
	}
}

run();
